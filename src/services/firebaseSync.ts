import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Hàm đẩy dữ liệu lên Firestore chung cho mọi danh mục (thu_chi, dau_tu, tai_san)
export async function addSyncedData(collectionName: string, data: any) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log("Đã đồng bộ lên Firebase thành công với ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Lỗi đồng bộ dữ liệu lên Firebase: ", error);
  }
}

// Hàm lắng nghe dữ liệu thời gian thực từ Firestore về giao diện
export function subscribeToSyncedData(collectionName: string, callback: (data: any[]) => void) {
  const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items: any[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    callback(items);
  });
}