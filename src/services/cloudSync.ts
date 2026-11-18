import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../firebase";

// 1. Hàm đẩy dữ liệu lên mây, chờ 30 giây rồi tự động kéo dữ liệu về
export async function syncPushToCloud(collectionName: string, payload: any, onPulledAfterDelay?: (updatedList: any[]) => void) {
  try {
    // Đẩy dữ liệu lên Firestore trước
    await addDoc(collection(db, collectionName), {
      ...payload,
      syncedAt: new Date().toISOString()
    });
    console.log("Đã đẩy lên mây thành công!");

    // Chờ 30 giây (30000ms) để dữ liệu trên mây đồng bộ ổn định rồi kéo về
    if (onPulledAfterDelay) {
      setTimeout(async () => {
        try {
          const q = query(collection(db, collectionName), orderBy("syncedAt", "desc"));
          const snapshot = await getDocs(q);
          const list: any[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          
          onPulledAfterDelay(list);
          console.log("Đã tự động kéo dữ liệu mới về sau 30s!");
        } catch (err) {
          console.error("Lỗi khi kéo dữ liệu sau thời gian chờ:", err);
        }
      }, 30000); 
    }
  } catch (error) {
    console.error(`Lỗi đồng bộ ${collectionName} lên Firebase:`, error);
  }
}

// 2. Hàm lắng nghe thời gian thực
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

export async function deleteFromCloud(collectionName: string, customId: string) {
  try {
    // 1. Truy vấn tìm document có trường `id` khớp với customId của bạn
    const q = query(collection(db, collectionName), where("id", "==", customId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`Không tìm thấy bản ghi nào trên Firebase có id là: ${customId}`);
      return;
    }

    // 2. Lặp qua các document tìm được (thường chỉ có 1) và lấy Document ID thật của Firebase để xóa
    const deletePromises = snapshot.docs.map((documentSnap) => {
      return deleteDoc(doc(db, collectionName, documentSnap.id));
    });

    await Promise.all(deletePromises);
    console.log(`Đã xóa thành công bản ghi có customId ${customId} trên Firebase!`);
  } catch (error) {
    console.error(`Lỗi khi xóa bản ghi ${customId}:`, error);
  }
}