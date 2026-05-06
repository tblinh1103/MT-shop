package com.techstore.service;

import com.techstore.dto.request.ChatRequest;
import com.techstore.dto.response.ChatResponse;
import com.techstore.dto.response.ProductOverviewResponse;

import com.techstore.entity.Product;
import com.techstore.entity.ProductVariant;
import com.techstore.entity.Brand;
import com.techstore.entity.Category;

import com.techstore.repository.ChatRepository;
import com.techstore.repository.BrandRepository;
import com.techstore.repository.CategoryRepository;
import com.techstore.repository.ProductRepository;

import com.techstore.specification.ProductSpecification;

import jakarta.servlet.http.HttpSession;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;

import java.util.List;

@Service
public class ChatService {
        private final ChatClient chatClient;

        private final ChatClient parserClient;

        private final ChatRepository chatRepository;
        private final ProductRepository productRepository;

        @Autowired
        private BrandRepository brandRepository;

        @Autowired
        private CategoryRepository categoryRepository;

        public ChatService(ChatClient.Builder builder,
                        JdbcChatMemoryRepository jdbcChatMemoryRepository,
                        ChatRepository chatRepository,
                        ProductRepository productRepository) {

                this.chatRepository = chatRepository;
                this.productRepository = productRepository;

                ChatMemory chatMemory = MessageWindowChatMemory.builder()
                                .chatMemoryRepository(jdbcChatMemoryRepository)
                                .maxMessages(5) // Mặc định là 20 (lưu lịch sử chat vào db để chatbot nhớ)
                                .build();

                chatClient = builder
                                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                                .build();
                this.parserClient = builder.build();
        }

        public String chat(ChatRequest request, HttpSession session) {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();

                String conversationId = (username != null && !"anonymousUser".equals(username))
                                ? "user-" + username
                                : "guest-" + session.getId().substring(0, 8);

                String parsePrompt = """
                                Bạn là hệ thống xử lý tìm kiếm sản phẩm.

                                Nhiệm vụ:
                                1. Sửa lỗi chính tả trong câu
                                2. Chuẩn hóa về từ đúng (ví dụ: "laptpo" → "laptop", "del" → "dell")
                                3. Trích xuất thông tin
                                4. Nếu brand là iphone thì trả về Apple
                                5. KHÔNG được thêm giải thích
                                6. KHÔNG được dùng ```json
                                7. Chỉ trả về JSON hợp lệ duy nhất

                                KHÔNG được suy diễn thêm.

                                Trả về JSON:

                                {
                                  "keyword": "",
                                  "brand": "",
                                  "category": "",
                                  "minPrice": null,
                                  "maxPrice": null,
                                  "specs": {}
                                }

                                Câu: "%s"
                                """
                                .formatted(request.getMessage());

                String aiJson;
                try {
                        aiJson = parserClient.prompt(parsePrompt).call().content();
                } catch (Exception e) {

                        System.out.println("AI FAIL → fallback");

                        // fallback cực đơn giản
                        aiJson = """
                                        {
                                          "keyword": "%s",
                                          "brand": "",
                                          "category": "",
                                          "minPrice": null,
                                          "maxPrice": null,
                                          "specs": {}
                                        }
                                        """.formatted(request.getMessage());
                }

                System.out.println("AI JSON: " + aiJson);

                // JSON → MAP
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> data;

                try {
                        data = mapper.readValue(aiJson, Map.class);
                } catch (Exception e) {
                        data = new HashMap<>();
                }

                // EXTRACT FIELD
                String keyword = (String) data.get("keyword");
                String brandName = (String) data.get("brand");
                String categoryName = (String) data.get("category");

                Double minPrice = data.get("minPrice") != null
                                ? ((Number) data.get("minPrice")).doubleValue()
                                : null;

                Double maxPrice = data.get("maxPrice") != null
                                ? ((Number) data.get("maxPrice")).doubleValue()
                                : null;

                // SAFE PARSE SPECS
                Map<String, String> specs = new HashMap<>();
                Object specsObj = data.get("specs");

                if (specsObj instanceof Map<?, ?> map) {
                        map.forEach((k, v) -> {
                                if (k != null && v != null) {
                                        specs.put(k.toString().toLowerCase(), v.toString().toLowerCase());
                                }
                        });
                }

                // FALLBACK nếu AI không hiểu
                if ((keyword == null || keyword.isBlank()) && (brandName == null || brandName.isBlank())
                                && (categoryName == null || categoryName.isBlank()) && minPrice == null
                                && maxPrice == null && specs.isEmpty()) {

                        keyword = request.getMessage(); // fallback keyword thô
                }

                // CONVERT NAME → ID
                String brandId = null;
                String categoryId = null;

                if (brandName != null && !brandName.isBlank()) {
                        brandId = brandRepository
                                        .findByBrandNameIgnoreCase(brandName)
                                        .map(Brand::getBrandId)
                                        .orElse(null);
                }

                if (categoryName != null && !categoryName.isBlank()) {
                        categoryId = categoryRepository
                                        .findByCategoryNameIgnoreCase(categoryName)
                                        .map(Category::getCategoryId)
                                        .orElse(null);
                }

                // BUILD SPECIFICATION (GIỮ NGUYÊN CODE CŨ)
                Specification<Product> spec = ProductSpecification.filter(
                                categoryId,
                                brandId,
                                "ACTIVE",
                                keyword,
                                minPrice,
                                maxPrice,
                                null);

                List<Product> products = productRepository.findAll(spec);

                // OPTIONAL: FILTER SPEC BẰNG JAVA (đúng logic AND)
                if (!specs.isEmpty()) {
                        products = products.stream()
                                        .filter(p -> matchAllSpecs(p, specs))
                                        .toList();
                }

                // LIMIT
                products = products.stream().limit(10).toList();

                String header = "| Tên sản phẩm  | Giá    | Hãng   |\n"
                                + "|---------------|--------|--------|";

                String rows = products.stream()
                                .map(p -> {
                                        ProductVariant v = p.getProductVariants()
                                                        .stream()
                                                        .findFirst()
                                                        .orElse(null);

                                        return "| " + String.format("%-15s", p.getProductName())
                                                        + " | " + String.format("%-10s", v.getPromotionalPrice())
                                                        + " | " + String.format("%-15s", p.getBrand().getBrandName())
                                                        + " |";
                                })
                                .collect(Collectors.joining("\n"));

                String productContext = header + "\n" + rows;

                SystemMessage systemMessage = new SystemMessage("""
                                Bạn là AI bán hàng của Minh Thành Computer.

                                Nguyên tắc:
                                - CHỈ được tư vấn dựa trên danh sách sản phẩm bên dưới
                                - KHÔNG được tự tạo sản phẩm ngoài danh sách
                                - Nếu không có sản phẩm phù hợp → trả lời: "Hiện shop chưa có sản phẩm phù hợp"
                                - Trả lời ngắn gọn, đúng trọng tâm
                                - Không lan man

                                Danh sách sản phẩm:
                                %s
                                """.formatted(productContext));

                UserMessage userMessage = new UserMessage(request.getMessage());

                Prompt prompt = new Prompt(systemMessage, userMessage);

                return chatClient.prompt(prompt)
                                .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, conversationId)).call()
                                .content();
        }

        public List<ChatResponse> getConversation(HttpSession session) {

                String username = SecurityContextHolder.getContext().getAuthentication().getName();

                String conversationId = (username != null && !"anonymousUser".equals(username))
                                ? "user-" + username
                                : "guest-" + session.getId().substring(0, 8);

                return chatRepository.findByConversationId(conversationId);
        }

        @Value("${spring.ai.openai.api-key}")
        private String apiKey;

        @PostConstruct
        public void checkKey() {
                System.out.println(">>> API Key Spring Boot đang đọc được là: [" + apiKey + "]");
        }

        private boolean matchAllSpecs(Product product, Map<String, String> specs) {

                for (ProductVariant v : product.getProductVariants()) {

                        boolean match = specs.entrySet().stream().allMatch(entry -> v.getProductSpecs().stream()
                                        .anyMatch(spec -> spec.getSpecKey().equalsIgnoreCase(entry.getKey()) &&
                                                        spec.getSpecValue().equalsIgnoreCase(entry.getValue())));

                        if (match)
                                return true;
                }

                return false;
        }

}
