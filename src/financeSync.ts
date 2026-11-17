// Bổ sung trong file src/services/financeSync.ts
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// Hàm đồng bộ chung cho các danh mục (thu-chi, đầu tư cổ phiếu, vàng)
export async function syncDataToCloud(category: string, data: any) {
  try {
    await addDoc(collection(db, category), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Lỗi đồng bộ ${category} lên cloud:`, error);
  }
}

export function subscribeToCategory(category: string, callback: (items: any[]) => void) {
  const q = query(collection(db, category), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docItem) => {
      list.push({ id: docItem.id, ...docItem.data() });
    });
    callback(list);
  });
}