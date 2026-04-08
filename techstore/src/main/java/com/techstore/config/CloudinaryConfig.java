package com.techstore.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary configKey() {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", "dpzqeta51");
        config.put("api_key", "566892975956869");
        config.put("api_secret", "FlPDEedKL7gFuqPTN97t2qMgNcM");
        return new Cloudinary(config);
    }
}
