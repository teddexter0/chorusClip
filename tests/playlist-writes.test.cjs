const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync(require.resolve('../src/lib/firebase.js'), 'utf8');
const publicClip = { id: 'public-clip', isPublic: true };
const privateClip = { id: 'private-clip', isPublic: false };

async function setup(playlist, publicPlaylist, readError) {
  const records = new Map();
  if (playlist) records.set('playlists/list', playlist);
  if (publicPlaylist) records.set('publicPlaylists/list', publicPlaylist);
  const writes = [];
  const context = vm.createContext({ process: { env: {} }, console: { log() {}, error() {} }, Date });
  const firestore = {
    getFirestore: () => ({}),
    doc: (_db, collection, id) => `${collection}/${id}`,
    getDoc: async ref => {
      if (readError && ref === 'publicPlaylists/list') throw readError;
      return { exists: () => records.has(ref), data: () => records.get(ref) };
    },
    writeBatch: () => {
      const pending = [];
      return {
        update: (ref, data) => pending.push({ kind: 'update', ref, data }),
        set: (ref, data) => pending.push({ kind: 'set', ref, data }),
        delete: ref => pending.push({ kind: 'delete', ref }),
        commit: async () => {
          // An owner-based delete rule denies a missing resource. Reproduce the
          // reported failure so this test fails for the previous implementation.
          if (pending.some(write => write.kind === 'delete' && !records.has(write.ref))) {
            throw new Error('Missing or insufficient permissions.');
          }
          writes.push(...pending);
          for (const write of pending) {
            if (write.kind === 'delete') records.delete(write.ref);
            else records.set(write.ref, write.kind === 'update'
              ? { ...records.get(write.ref), ...write.data } : write.data);
          }
        }
      };
    }
  };
  for (const name of ['setDoc', 'updateDoc', 'collection', 'query', 'where', 'getDocs', 'orderBy', 'limit', 'onSnapshot', 'startAfter']) {
    firestore[name] = () => { throw new Error(`Unexpected call: ${name}`); };
  }
  const auth = Object.fromEntries([
    'getAuth', 'sendEmailVerification', 'signInWithEmailAndPassword',
    'createUserWithEmailAndPassword', 'sendPasswordResetEmail', 'signOut'
  ].map(name => [name, () => ({})]));
  const modules = new Map(Object.entries({
    'firebase/app': { initializeApp: () => ({}) },
    'firebase/auth': auth,
    'firebase/firestore': firestore
  }).map(([name, exports]) => [name, new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context })]));
  const module = new vm.SourceTextModule(source, {
    context,
    importModuleDynamically: async name => modules.get(name)
  });
  await module.link(name => modules.get(name));
  await module.evaluate();
  return { updatePlaylist: module.namespace.updatePlaylist, records, writes };
}

const basePlaylist = { userId: 'owner', name: 'Favorites', isPublic: false, clips: [] };

test('add to a private playlist without a public copy succeeds', async () => {
  const { updatePlaylist, records, writes } = await setup(basePlaylist);
  await updatePlaylist('list', { clips: [privateClip] });
  assert.equal(records.get('playlists/list').clips[0].id, privateClip.id);
  assert.deepEqual(writes.map(write => write.kind), ['update']);
  assert.equal(records.has('publicPlaylists/list'), false);
});

test('a private playlist stays private when a public clip is added', async () => {
  const { updatePlaylist, records } = await setup(basePlaylist);
  await updatePlaylist('list', { clips: [publicClip] });
  assert.equal(records.get('playlists/list').isPublic, false);
  assert.equal(records.has('publicPlaylists/list'), false);
});

test('a public playlist with no public members and no copy still saves', async () => {
  const { updatePlaylist, records } = await setup({ ...basePlaylist, isPublic: true });
  await updatePlaylist('list', { clips: [privateClip] });
  assert.equal(records.get('playlists/list').clips.length, 1);
  assert.equal(records.has('publicPlaylists/list'), false);
});

test('publishing creates a copy containing only public clips', async () => {
  const { updatePlaylist, records } = await setup(basePlaylist);
  await updatePlaylist('list', { isPublic: true, clips: [publicClip, privateClip] });
  const projection = records.get('publicPlaylists/list');
  assert.equal(projection.clips.length, 1);
  assert.equal(projection.clips[0].id, publicClip.id);
  assert.equal(projection.publicClipCount, 1);
  assert.equal(projection.totalClipCount, 2);
});

test('updating a public copy preserves its community likes', async () => {
  const { updatePlaylist, records } = await setup(
    { ...basePlaylist, isPublic: true, likes: 0 },
    { ...basePlaylist, isPublic: true, likes: 7 }
  );
  await updatePlaylist('list', { clips: [publicClip, privateClip] });
  assert.equal(records.get('publicPlaylists/list').likes, 7);
  assert.equal(records.get('publicPlaylists/list').clips.length, 1);
});

for (const updates of [{ isPublic: false }, { clips: [privateClip] }]) {
  test(`existing public copy is removed for ${JSON.stringify(updates)}`, async () => {
    const published = { ...basePlaylist, isPublic: true, clips: [publicClip] };
    const { updatePlaylist, records, writes } = await setup(published, published);
    await updatePlaylist('list', updates);
    assert.equal(records.has('publicPlaylists/list'), false);
    assert.deepEqual(writes.map(write => write.kind), ['update', 'delete']);
  });
}

test('permission errors are propagated without a partial save', async () => {
  const error = new Error('Missing or insufficient permissions.');
  const { updatePlaylist, records, writes } = await setup(basePlaylist, undefined, error);
  await assert.rejects(updatePlaylist('list', { clips: [privateClip] }), error);
  assert.equal(records.get('playlists/list').clips.length, 0);
  assert.equal(writes.length, 0);
});
