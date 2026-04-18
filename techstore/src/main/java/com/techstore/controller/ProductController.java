package com.techstore.controller;

import com.techstore.dto.request.ProductCreateRequest;
import com.techstore.dto.request.ProductUpdateRequest;
import com.techstore.dto.response.ApiResponse;
import com.techstore.dto.response.ProductOverviewResponse;
import com.techstore.dto.response.ProductResponse;
import com.techstore.enums.ProductStatus;
import com.techstore.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép frontend gọi từ mọi domain
public class ProductController {
        private final ProductService productService;

        @PostMapping
        public ApiResponse<ProductResponse> createProduct(@RequestBody ProductCreateRequest request) {
                return ApiResponse.<ProductResponse>builder()
                                .message("Tạo mới sản phẩm thành công")
                                .result(productService.createProduct(request))
                                .build();
        }

        @GetMapping()
        public ApiResponse<List<ProductResponse>> getAllProducts() {
                return ApiResponse.<List<ProductResponse>>builder()
                                .result(productService.getAllProducts())
                                .build();
        }

        @GetMapping("/{productId}")
        public ApiResponse<ProductResponse> getProductByProductId(@PathVariable String productId) {
                return ApiResponse.<ProductResponse>builder()
                                .result(productService.getProductByProductId(productId))
                                .build();
        }

        @GetMapping("/phones")
        public ApiResponse<List<ProductOverviewResponse>> getAllPhoneOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getAllProductOverviews("Điện thoại", null))
                                .build();
        }

        @GetMapping("/laptops")
        public ApiResponse<List<ProductOverviewResponse>> getAllLaptopOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getAllProductOverviews("Laptop", null))
                                .build();
        }

        @GetMapping("/charging-adapters")
        public ApiResponse<List<ProductOverviewResponse>> getAllChargingAdapterOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getAllProductOverviews("Củ sạc", null))
                                .build();
        }

        @GetMapping("/charging-cables")
        public ApiResponse<List<ProductOverviewResponse>> getAllChargingCableOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getAllProductOverviews("Cáp sạc", null))
                                .build();
        }

        @GetMapping("/mouses")
        public ApiResponse<List<ProductOverviewResponse>> getAllMouseOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getAllProductOverviews("Chuột", null))
                                .build();
        }

        @GetMapping("/keyboards")
        public ApiResponse<List<ProductOverviewResponse>> getAllKeyboardOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getAllProductOverviews("Bàn phím", null))
                                .build();
        }

        // filter?categoryId=?&brandId=?
        @GetMapping("/filter")
        public ApiResponse<List<ProductResponse>> getProductsByCategoryAndBrand(
                        @RequestParam(required = false) String categoryId,
                        @RequestParam(required = false) String brandId) {
                List<ProductResponse> products = productService.getAllProductsByCategoryIdAndBrandId(categoryId,
                                brandId);
                return ApiResponse.<List<ProductResponse>>builder()
                                .result(products)
                                .build();
        }

        @GetMapping("/search")
        public ApiResponse<List<ProductOverviewResponse>> searchProducts(@RequestParam String keyword) {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.searchProductsByKeyword(keyword))
                                .build();
        }

        @GetMapping("/latest")
        public ApiResponse<List<ProductOverviewResponse>> getTop4LatestProductOverviews() {
                return ApiResponse.<List<ProductOverviewResponse>>builder()
                                .result(productService.getTop4LatestProductOverviews())
                                .build();
        }

        @PutMapping("/{productId}/status")
        public ApiResponse<ProductResponse> changeProductStatus(
                        @PathVariable String productId,
                        @RequestParam ProductStatus status) {
                return ApiResponse.<ProductResponse>builder()
                                .message("Cập nhật trạng thái thành công")
                                .result(productService.changeProductStatus(productId, status))
                                .build();
        }

        @PatchMapping("/{productId}")
        public ApiResponse<ProductResponse> updateProduct(
                        @PathVariable String productId,
                        @RequestBody ProductUpdateRequest request) {
                return ApiResponse.<ProductResponse>builder()
                                .message("Cập nhật sản phẩm thành công")
                                .result(productService.updateProduct(productId, request))
                                .build();
        }

        @DeleteMapping("/{productId}")
        public ApiResponse<Void> deleteProduct(@PathVariable String productId) {
                productService.deleteProduct(productId);
                return ApiResponse.<Void>builder()
                                .message("Xóa thành công")
                                .build();
        }

        @GetMapping("/advanced-filter")
        public ApiResponse<Page<ProductResponse>> filterProductsAdvanced(

                        @RequestParam(required = false) String categoryId,
                        @RequestParam(required = false) String brandId,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) Double minPrice,
                        @RequestParam(required = false) Double maxPrice,
                        @RequestParam(required = false) Boolean inStock,

                        // 🔥 pagination
                        @RequestParam(defaultValue = "0") Integer page,
                        @RequestParam(defaultValue = "10") Integer size) {

                // 🔥 tránh null + lỗi input từ request
                int pageValue = (page == null || page < 0) ? 0 : page;
                int sizeValue = (size == null || size <= 0) ? 10 : size;

                Page<ProductResponse> products = productService.filterProductsAdvanced(
                                categoryId,
                                brandId,
                                status,
                                keyword,
                                minPrice,
                                maxPrice,
                                inStock,
                                pageValue,
                                sizeValue);

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(products)
                                .build();
        }
}
