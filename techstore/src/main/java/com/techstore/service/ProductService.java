package com.techstore.service;

import com.techstore.dto.request.ProductCreateRequest;
import com.techstore.dto.request.ProductUpdateRequest;
import com.techstore.dto.response.ProductOverviewResponse;
import com.techstore.dto.response.ProductResponse;
import com.techstore.dto.response.ReviewResponse;
import com.techstore.entity.Brand;
import com.techstore.entity.Category;
import com.techstore.entity.Product;
import com.techstore.entity.Review;
import com.techstore.entity.Image;
import com.techstore.enums.ProductStatus;
import com.techstore.exception.AppException;
import com.techstore.exception.ErrorCode;
import com.techstore.mapper.ProductMapper;
import com.techstore.mapper.ReviewMapper;
import com.techstore.repository.BrandRepository;
import com.techstore.repository.CategoryRepository;
import com.techstore.repository.ProductRepository;
import com.techstore.specification.ProductSpecification;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    private final ProductMapper productMapper;
    private final ReviewMapper reviewMapper;

    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = productMapper.toProduct(request);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_EXISTED));

        product.setCategory(category);
        product.setBrand(brand);

        if (product.getImages() != null) {
            Product tmp = product;
            product.getImages().forEach(img -> img.setProduct(tmp));
        }

        product = productRepository.save(product);

        return productMapper.toProductResponse(product);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(product -> {
                    ProductResponse productResponse = productMapper.toProductResponse(product);
                    List<ReviewResponse> reviewResponses = new ArrayList<>();
                    for (Review review : product.getReviews()) {
                        reviewResponses.add(reviewMapper.toReviewResponse(review));
                    }
                    productResponse.setReviews(reviewResponses);
                    return productResponse;
                })
                .toList();
    }

    public List<ProductResponse> getAllProductsByCategoryIdAndBrandId(String categoryId, String brandId) {
        return productRepository.findAllByCategoryIdAndBrandId(categoryId, brandId)
                .stream()
                .map(product -> productMapper.toProductResponse(product))
                .toList();
    }

    public ProductResponse getProductByProductId(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductResponse productResponse = productMapper.toProductResponse(product);
        List<ReviewResponse> reviewResponses = new ArrayList<>();
        for (Review review : product.getReviews()) {
            reviewResponses.add(reviewMapper.toReviewResponse(review));
        }
        productResponse.setReviews(reviewResponses);
        return productResponse;
    }

    public List<ProductOverviewResponse> getAllProductOverviews(String categoryName, String brandName) {
        List<ProductOverviewResponse> products = productRepository.findAllProductOverviews(categoryName, brandName);
        if (products.isEmpty())
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        return products;
    }

    public List<ProductOverviewResponse> getTop4LatestProductOverviews() {
        List<ProductOverviewResponse> products = productRepository.findTop4LatestProductOverviews(PageRequest.of(0, 8));
        if (products.isEmpty())
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        return products;
    }

    public List<ProductOverviewResponse> searchProductsByKeyword(String keyword) {
        List<ProductOverviewResponse> products = productRepository.searchProductsByKeyword(keyword);
        if (products.isEmpty()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        return products;
    }

    public ProductResponse changeProductStatus(String productId, ProductStatus status) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setProductStatus(status.name());

        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse updateProduct(String productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (request.getProductName() != null) {
            product.setProductName(request.getProductName());
        }

        if (request.getWarrantyMonths() != null) {
            product.setWarrantyMonths(request.getWarrantyMonths());
        }

        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_EXISTED));
            product.setBrand(brand);
        }

        // 🔥 enum → string (nếu DB bạn lưu string)
        if (request.getStatus() != null) {
            product.setProductStatus(request.getStatus().name());
        }

        if (request.getImages() != null) {

            List<Image> images = request.getImages().stream()
                    .map(img -> {
                        Image image = new Image();
                        image.setImageUrl(img.getImageUrl());
                        image.setProduct(product);
                        image.setIsMain(img.getIsMain());
                        return image;
                    })
                    .toList();

            product.setImages(new ArrayList<>(images));
        }

        return productMapper.toProductResponse(productRepository.save(product));
    }

    public void deleteProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        productRepository.delete(product);
    }

    public Page<ProductResponse> filterProductsAdvanced(
            String categoryId,
            String brandId,
            String status,
            String keyword,
            Double minPrice,
            Double maxPrice,
            Boolean inStock,
            int page,
            int size) {

        // 🔥 tránh page âm hoặc size quá lớn
        if (page < 0)
            page = 0;
        if (size <= 0)
            size = 10;
        if (size > 50)
            size = 50; // giới hạn để tránh load nặng

        // 🔥 có thể thêm sort mặc định
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Specification<Product> spec = ProductSpecification.filter(
                categoryId, brandId, status, keyword, minPrice, maxPrice, inStock);

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        // 🔥 nếu muốn xử lý thêm logic business thì làm ở đây
        return productPage.map(productMapper::toProductResponse);
    }
}
