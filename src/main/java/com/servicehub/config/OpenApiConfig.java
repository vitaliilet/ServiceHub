
package com.servicehub.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI serviceHubOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ServiceHub API")
                        .version("1.0.0")
                        .description(
                                "REST API for ServiceHub — a platform " +
                                        "for finding specialists, booking services, " +
                                        "managing appointments, reviews and accounts."
                        ));
    }
}

