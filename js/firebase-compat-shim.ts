// Lightweight compat shim to emulate Firebase v8 namespace APIs on top of v9 modular
// This avoids invasive refactors while keeping code tree-shakeable.
import { auth, db, storage } from '../src/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  collection as mCollection,
  doc as mDoc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query as mQuery,
  where as mWhere,
  orderBy as mOrderBy,
  limit as mLimit,
  serverTimestamp
} from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

type Unsub = () => void;

function wrapCollection(path: string) {
  const cRef = mCollection(db, path);
  return {
    add: (data: any) => addDoc(cRef, data),
    doc: (id: string) => wrapDoc(path, id),
    onSnapshot: (cb: Function) => onSnapshot(cRef, (snap) => cb(snap)),
    // basic query builder subset
    where: (...args: any[]) => wrapQuery(mQuery(cRef, mWhere.apply(null, args as any))),
    orderBy: (...args: any[]) => wrapQuery(mQuery(cRef, mOrderBy.apply(null, args as any))),
    limit: (n: number) => wrapQuery(mQuery(cRef, mLimit(n))),
    _ref: cRef
  };
}

function wrapQuery(q: any) {
  return {
    onSnapshot: (cb: Function): Unsub => onSnapshot(q, (snap) => cb(snap)),
    get: async () => getDocs(q),
    where: (...args: any[]) => wrapQuery(mQuery(q, mWhere.apply(null, args as any))),
    orderBy: (...args: any[]) => wrapQuery(mQuery(q, mOrderBy.apply(null, args as any))),
    limit: (n: number) => wrapQuery(mQuery(q, mLimit(n))),
    _ref: q
  };
}

function wrapDoc(path: string, id: string) {
  const dRef = mDoc(db, path, id);
  return {
    get: () => getDoc(dRef),
    set: (data: any, opts?: any) => setDoc(dRef, data, opts),
    update: (data: any) => updateDoc(dRef, data),
    delete: () => deleteDoc(dRef),
    onSnapshot: (cb: Function): Unsub => onSnapshot(dRef, (snap) => cb(snap)),
    _ref: dRef
  };
}

// Expose a minimal compat surface used in the project
const compat = {
  auth() {
    return {
      signInWithEmailAndPassword: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
      createUserWithEmailAndPassword: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password),
      onAuthStateChanged: (cb: Function) => onAuthStateChanged(auth, (u) => cb(u)),
      signOut: () => signOut(auth),
      get currentUser() { return auth.currentUser; },
      updatePassword: (user: any, newPass: string) => updatePassword(user, newPass),
      sendPasswordResetEmail: (email: string) => sendPasswordResetEmail(auth, email)
    };
  },
  firestore() {
    return {
      collection: (path: string) => wrapCollection(path),
      doc: (path: string, id: string) => wrapDoc(path, id),
      FieldValue: { serverTimestamp }
    };
  },
  storage() {
    return {
      ref: (path: string) => sRef(storage, path),
      uploadBytes: (ref: any, data: Blob | ArrayBuffer | Uint8Array) => uploadBytes(ref, data),
      getDownloadURL: (ref: any) => getDownloadURL(ref),
      deleteObject: (ref: any) => deleteObject(ref)
    };
  },
  FieldValue: { serverTimestamp }
};

// Attach to window
(window as any).firebase = compat;
export default compat;
