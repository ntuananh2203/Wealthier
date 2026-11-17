// src/services/financeSync.ts
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// 1. Hàm đẩy dữ liệu mới lên Cloud Firebase từ bất kỳ thiết bị nào
export async function addDataToCloud(collectionName: string, data: any) {
  try {
    await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Lỗi khi đồng bộ lên cloud: ", error);
  }
}

// 2. Hàm lắng nghe thay đổi thời gian thực cho mọi thiết bị
export function subscribeToData(collectionName: string, callback: (items: any[]) => void) {
  const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
  
  // onSnapshot sẽ tự động kích hoạt ngay lập tức khi có bất kỳ thiết bị nào thay đổi dữ liệu
  return onSnapshot(q, (querySnapshot) => {
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    callback(list);
  });
}