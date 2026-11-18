import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs , where } from "firebase/firestore";
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
export async function deleteFromCloud(collectionName: string, targetId: string) {
  try {
    // 1. Truy vấn tìm document trên Firestore có trường "id" trùng với targetId (ví dụ: tx-1718...)
    const q = query(collection(db, collectionName), where("id", "==", targetId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`Không tìm thấy bản ghi trên Firebase có id là: ${targetId}`);
      return;
    }

    // 2. Lấy Document ID thật của Firebase để tiến hành xóa chuẩn xác
    const deletePromises = snapshot.docs.map((documentSnap) => {
      return deleteDoc(doc(db, collectionName, documentSnap.id));
    });

    await Promise.all(deletePromises);
    console.log(`Đã xóa thành công bản ghi ${targetId} trên Firebase!`);
  } catch (error) {
    console.error(`Lỗi khi xóa bản ghi ${targetId}:`, error);
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