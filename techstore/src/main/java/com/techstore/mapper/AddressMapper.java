package com.techstore.mapper;

import com.techstore.dto.request.AddressRequest;
import com.techstore.dto.response.AddressResponse;
import com.techstore.entity.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AddressMapper {
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "user", ignore = true)
    Address toAddress(AddressRequest addressRequest);

    AddressResponse toAddressResponse(Address address);
}
