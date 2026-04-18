package com.techstore.service;

import com.techstore.dto.request.ProductSpecRequest;
import com.techstore.dto.request.ProductVariantCreateRequest;
import com.techstore.dto.request.ProductVariantUpdateRequest;
import com.techstore.dto.response.ProductVariantResponse;
import com.techstore.entity.Product;
import com.techstore.entity.ProductSpec;
import com.techstore.entity.ProductVariant;
import com.techstore.exception.AppException;
import com.techstore.exception.ErrorCode;
import com.techstore.mapper.ProductSpecMapper;
import com.techstore.mapper.ProductVariantMapper;
import com.techstore.repository.ProductRepository;
import com.techstore.repository.ProductSpecRepository;
import com.techstore.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductVariantService {
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final ProductSpecRepository productSpecRepository;

    private final ProductVariantMapper productVariantMapper;
    private final ProductSpecMapper productSpecMapper;

    @Transactional
    public ProductVariantResponse createProductVariant(ProductVariantCreateRequest request) {
        ProductVariant productVariant = productVariantMapper.toProductVariant(request);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        var currentDefaultOption = productVariantRepository
                .findByProduct_ProductIdAndIsDefaultTrue(request.getProductId());

        productVariant.setProduct(product);

        if (currentDefaultOption.isEmpty()) {
            productVariant.setIsDefault(true);
        } else {
            ProductVariant currentDefaultProductVariant = currentDefaultOption.get();
            if (Boolean.TRUE.equals(productVariant.getIsDefault())) {
                currentDefaultProductVariant.setIsDefault(false);
                productVariant.setIsDefault(true);
                productVariantRepository.save(currentDefaultProductVariant);
            } else {
                productVariant.setIsDefault(false);
            }
        }

        List<ProductSpec> productSpecs = new ArrayList<>();
        for (ProductSpecRequest productSpecRequest : request.getProductSpecs()) {
            ProductSpec productSpec = productSpecMapper.toProductSpec(productSpecRequest);
            productSpec.setProductVariant(productVariant);
            productSpecs.add(productSpec);
        }

        productVariant.setProductSpecs(productSpecs);

        productVariant = productVariantRepository.save(productVariant);

        return productVariantMapper.toProductVariantResponse(productVariant);
    }

    public void deleteProductVariant(String id) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm với id: " + id));

        productVariantRepository.delete(variant);
    }

    @Transactional
    public ProductVariantResponse updateProductVariant(String id, ProductVariantUpdateRequest request) {

        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // ===== UPDATE BASIC INFO =====
        if (request.getColor() != null) {
            variant.setColor(request.getColor());
        }

        if (request.getOriginalPrice() != null) {
            variant.setOriginalPrice(request.getOriginalPrice());
        }

        if (request.getPromotionalPrice() != null) {
            variant.setPromotionalPrice(request.getPromotionalPrice());
        }

        if (request.getStock() != null) {
            variant.setStock(request.getStock());
        }

        if (request.getIsDefault() != null) {
            variant.setIsDefault(request.getIsDefault());
        }

        // ===== UPDATE SPECS (IMPORTANT PART) =====
        if (request.getProductSpecs() != null) {

            // 1. XÓA specs cũ
            productSpecRepository.deleteByVariantId(id);

            // 2. INSERT specs mới
            List<ProductSpec> specs = request.getProductSpecs().stream()
                    .map(specReq -> ProductSpec.builder()
                            .productVariant(variant)
                            .specKey(specReq.getSpecKey())
                            .specValue(specReq.getSpecValue())
                            .build())
                    .toList();

            productSpecRepository.saveAll(specs);
        }

        return productVariantMapper.toProductVariantResponse(productVariantRepository.save(variant));
    }
}
