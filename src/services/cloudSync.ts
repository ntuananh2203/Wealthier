import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
// Hàm đồng bộ dữ liệu lên mây (dùng chung cho thu chi, đầu tư, vàng)
export async function syncPushToCloud(collectionName: string, payload: any) {
  try {
    await addDoc(collection(db, collectionName), {
      ...payload,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Lỗi đồng bộ ${collectionName} lên Firebase:`, error);
  }
}

// Hàm lắng nghe dữ liệu thời gian thực từ mây về app
export function syncPullFromCloud(collectionName: string, onDataUpdate: (data: any[]) => void) {
  const q = query(collection(db, collectionName), orderBy("syncedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onDataUpdate(list);
  });
}