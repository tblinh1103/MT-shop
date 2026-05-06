package com.techstore.service;

import com.techstore.entity.User;
import com.techstore.enums.DiscountStatus;
import com.techstore.dto.request.DiscountRequest;
import com.techstore.dto.response.ApplyDiscountResponse;
import com.techstore.dto.response.DiscountResponse;
import com.techstore.entity.Discount;
import com.techstore.exception.AppException;
import com.techstore.exception.ErrorCode;
import com.techstore.mapper.DiscountMapper;
import com.techstore.repository.DiscountRepository;
import com.techstore.repository.UserDiscountRepository;
import com.techstore.repository.UserRepository;
import com.techstore.specification.DiscountSpecification;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class DiscountService {
    private final DiscountRepository discountRepository;

    private final DiscountStatusService discountStatusService;

    private final DiscountMapper discountMapper;

    private final UserDiscountRepository userDiscountRepository;

    private final UserRepository userRepository;

    public DiscountResponse createDiscount(DiscountRequest discountRequest) {
        if (discountRepository.existsByCode(discountRequest.getCode())) {
            throw new AppException(ErrorCode.DISCOUNT_CODE_EXISTED);
        }

        if (discountRequest.getStartDate().isAfter(discountRequest.getEndDate())) {
            throw new AppException(ErrorCode.DISCOUNT_DATE_INVALID);
        }

        Discount discount = discountMapper.toDiscount(discountRequest);
        discount.setRemainingQuantity(discount.getTotalQuantity());
        discount = discountRepository.save(discount);
        DiscountResponse res = discountMapper.toDiscountResponse(discount);
        res.setStatus(discountStatusService.resolve(discount));
        return res;
    }

    public List<DiscountResponse> getAllDiscounts() {
        return discountRepository.findAllByOrderByEndDateDesc()
                .stream()
                .map(discount -> {
                    DiscountResponse res = discountMapper.toDiscountResponse(discount);
                    res.setStatus(discountStatusService.resolve(discount));
                    return res;
                })
                .toList();
    }

    public List<DiscountResponse> getAllDiscountsForCustomer() {
        LocalDate today = LocalDate.now();

        List<Discount> discounts = discountRepository.findAll();

        return discounts.stream()
                .map(discount -> {
                    DiscountStatus status = discountStatusService.resolve(discount);

                    if (status != DiscountStatus.ACTIVE)
                        return null;

                    DiscountResponse res = discountMapper.toDiscountResponse(discount);
                    res.setStatus(status);
                    return res;
                })
                .filter(res -> res != null)
                .toList();
    }

    public ApplyDiscountResponse applyDiscount(String discountCode, BigDecimal cartTotal) {

        Discount discount = discountRepository.findByCode(discountCode)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_EXISTED));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String userId = user.getUserId();
        // 🔥 check user đã dùng chưa
        if (userDiscountRepository.existsByUserIdAndDiscountId(userId, discount.getDiscountId())) {
            throw new AppException(ErrorCode.DISCOUNT_ALREADY_USED);
        }

        DiscountStatus status = discountStatusService.resolve(discount);

        switch (status) {
            case UPCOMING -> throw new AppException(ErrorCode.DISCOUNT_NOT_STARTED);
            case EXPIRED -> throw new AppException(ErrorCode.DISCOUNT_EXPIRED);
            case INACTIVE -> throw new AppException(ErrorCode.DISCOUNT_DISABLED);
            case USED_UP -> throw new AppException(ErrorCode.DISCOUNT_OUT_OF_STOCK);
        }

        if (cartTotal.compareTo(discount.getMinOrderAmount()) < 0) {
            throw new AppException(ErrorCode.DISCOUNT_INVALID);
        }

        BigDecimal discountAmount = cartTotal
                .multiply(BigDecimal.valueOf(discount.getDiscountPercent()))
                .divide(BigDecimal.valueOf(100));

        if (discount.getMaxDiscountAmount() != null &&
                discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
            discountAmount = discount.getMaxDiscountAmount();
        }

        BigDecimal finalAmount = cartTotal.subtract(discountAmount);

        return ApplyDiscountResponse.builder()
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }

    public DiscountResponse updateDiscountStatus(String discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_EXISTED));

        discount.setIsActive(!discount.getIsActive());

        discountRepository.save(discount);
        DiscountResponse res = discountMapper.toDiscountResponse(discount);
        res.setStatus(discountStatusService.resolve(discount));
        return res;
    }

    @Transactional
    public DiscountResponse updateDiscount(String discountId, DiscountRequest discountRequest) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_EXISTED));

        if (!discount.getCode().equals(discountRequest.getCode()) &&
                discountRepository.existsByCode(discountRequest.getCode())) {
            throw new AppException(ErrorCode.DISCOUNT_CODE_EXISTED);
        }

        if (discountRequest.getStartDate().isAfter(discountRequest.getEndDate())
                || discountRequest.getStartDate().isEqual(discountRequest.getEndDate())) {
            throw new AppException(ErrorCode.DISCOUNT_DATE_INVALID);
        }

        discount.setCode(discountRequest.getCode());
        discount.setDescription(discountRequest.getDescription());
        discount.setDiscountPercent(discountRequest.getDiscountPercent());
        discount.setMinOrderAmount(discountRequest.getMinOrderAmount());
        discount.setMaxDiscountAmount(discountRequest.getMaxDiscountAmount());
        int used = discount.getTotalQuantity() - discount.getRemainingQuantity();

        discount.setTotalQuantity(discountRequest.getTotalQuantity());
        int newRemaining = discountRequest.getTotalQuantity() - used;
        if (newRemaining < 0) {
            throw new AppException(ErrorCode.DISCOUNT_QUANTITY_INVALID);
        }
        discount.setRemainingQuantity(newRemaining);
        discount.setStartDate(discountRequest.getStartDate());
        discount.setEndDate(discountRequest.getEndDate());
        discount.setIsActive(discountRequest.getIsActive());

        discount = discountRepository.save(discount);
        DiscountResponse res = discountMapper.toDiscountResponse(discount);
        res.setStatus(discountStatusService.resolve(discount));
        return res;
    }

    @Transactional
    public void deleteDiscount(String discountId) {
        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_EXISTED));

        discountRepository.delete(discount);
    }

    public Page<DiscountResponse> filterDiscounts(
            String keyword,
            Boolean systemStatus,
            LocalDate startDateFrom,
            LocalDate startDateTo,
            Integer minPercent,
            Integer maxPercent,
            String effectiveStatus,
            String availabilityStatus,
            int page,
            int size) {

        var spec = DiscountSpecification.filter(
                keyword,
                systemStatus,
                startDateFrom,
                startDateTo,
                minPercent,
                maxPercent,
                availabilityStatus);

        Page<Discount> discounts = discountRepository.findAll(
                spec,
                PageRequest.of(page, size));

        List<Discount> all = discountRepository.findAll(spec);

        List<DiscountResponse> filteredAll = all.stream()
                .map(discount -> {
                    DiscountResponse res = discountMapper.toDiscountResponse(discount);

                    DiscountStatus status = discountStatusService.resolve(discount);
                    res.setStatus(status);

                    return res;
                })
                .filter(dto -> {
                    if (effectiveStatus == null || effectiveStatus.isBlank())
                        return true;

                    return dto.getStatus().name().equals(effectiveStatus);
                })
                .toList();

        int start = page * size;
        int end = Math.min(start + size, filteredAll.size());

        List<DiscountResponse> pageContent = (start >= filteredAll.size()) ? List.of()
                : filteredAll.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), filteredAll.size());
    }

}
