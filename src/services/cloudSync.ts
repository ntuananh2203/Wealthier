import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// 1. Đẩy lên mây và tự động gắn ID chuẩn của Firebase vào payload
export async function syncPushToCloud(collectionName: string, payload: any, onPulledAfterDelay?: (updatedList: any[]) => void) {
  try {
    // Loại bỏ id tạm nếu có để Firebase tự cấp Document ID thật
    const { id, ...restPayload } = payload;
    
    await addDoc(collection(db, collectionName), {
      ...restPayload,
      syncedAt: new Date().toISOString()
    });
    console.log("Đã đẩy lên mây thành công!");

    if (onPulledAfterDelay) {
      setTimeout(async () => {
        try {
          const q = query(collection(db, collectionName), orderBy("syncedAt", "desc"));
          const snapshot = await getDocs(q);
          const list: any[] = [];
          snapshot.forEach((doc) => {
            // Lấy trực tiếp id chuẩn của Firebase gán vào item
            list.push({ id: doc.id, ...doc.data() });
          });
          onPulledAfterDelay(list);
        } catch (err) {
          console.error("Lỗi khi kéo dữ liệu:", err);
        }
      }, 30000);
    }
  } catch (error) {
    console.error(`Lỗi đồng bộ ${collectionName}:`, error);
  }
}

// 2. Hàm xóa cực kỳ đơn giản vì `docId` bây giờ đã là ID chuẩn của Firebase
export async function deleteFromCloud(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    console.log(`Đã xóa thành công bản ghi ${docId} trên Firebase!`);
  } catch (error) {
    console.error(`Lỗi khi xóa bản ghi ${docId}:`, error);
  }
}

// 3. Hàm lắng nghe thời gian thực cho mọi thiết bị (Laptop & Điện thoại)
export function syncPullFromCloud(collectionName: string, onDataUpdate: (data: any[]) => void) {
  const q = query(collection(db, collectionName), orderBy("syncedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      // Đảm bảo lấy doc.id làm định danh chính xác tuyệt đối
      list.push({ id: doc.id, ...doc.data() });
    });
    onDataUpdate(list);
  });
}