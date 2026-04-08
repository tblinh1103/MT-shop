package com.techstore.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UploadImageFileService {
    private final Cloudinary cloudinary;

    @SuppressWarnings("unchecked")
    public String uploadImage(MultipartFile file) throws IOException {
        assert file.getOriginalFilename() != null;

        String publicValue = generatePublicValue(file.getOriginalFilename());

        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("public_id", publicValue));

        return uploadResult.get("secure_url").toString(); // ✅ lấy link trực tiếp
    }

    public String generatePublicValue(String originalName) {
        String fileName = getFileName(originalName)[0];
        return StringUtils.join(UUID.randomUUID().toString(), "_", fileName);
    }

    public String[] getFileName(String originalName) {
        int lastDotIndex = originalName.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return new String[] { originalName, "" };
        }
        return new String[] {
                originalName.substring(0, lastDotIndex),
                originalName.substring(lastDotIndex + 1)
        };
    }
}
