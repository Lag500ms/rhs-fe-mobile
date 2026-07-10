import apiClient from '../../../lib/apiClient';
import { PagedResult, WishlistItemResponse } from '../types/wishlist';

/** Response body chuẩn từ backend */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const wishlistApi = {
  /**
   * Lấy danh sách yêu thích của người dùng hiện tại (có phân trang, mới nhất trước).
   * GET api/wishlist?pageIndex=1&pageSize=10
   */
  getWishlist: async (pageIndex = 1, pageSize = 10): Promise<PagedResult<WishlistItemResponse>> => {
    const response = await apiClient.get<ApiResponse<PagedResult<WishlistItemResponse>>>(
      '/wishlist',
      { params: { pageIndex, pageSize } }
    );
    return response.data.data;
  },

  /**
   * Thêm một dự án vào danh sách yêu thích.
   * POST api/wishlist/{projectId}
   */
  addToWishlist: async (projectId: string): Promise<void> => {
    await apiClient.post(`/wishlist/${projectId}`);
  },

  /**
   * Xóa một dự án khỏi danh sách yêu thích.
   * DELETE api/wishlist/{projectId}
   */
  removeFromWishlist: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/wishlist/${projectId}`);
  },

  /**
   * Kiểm tra nhanh xem một dự án có đang trong danh sách yêu thích không.
   * GET api/wishlist/{projectId}/status
   */
  checkWishlistStatus: async (projectId: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<{ isInWishlist: boolean }>>(
      `/wishlist/${projectId}/status`
    );
    return response.data.data.isInWishlist;
  },

  /**
   * Lấy chi tiết một wishlist item theo projectId.
   * GET api/wishlist/by-project/{projectId}
   */
  getWishlistItemByProject: async (projectId: string): Promise<WishlistItemResponse | null> => {
    try {
      const response = await apiClient.get<ApiResponse<WishlistItemResponse>>(
        `/wishlist/by-project/${projectId}`
      );
      return response.data.data;
    } catch {
      // 404 - dự án chưa có trong wishlist
      return null;
    }
  },
};
