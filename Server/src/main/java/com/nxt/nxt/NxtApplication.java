package com.nxt.nxt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.AbstractEnvironment;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class NxtApplication {

    public static void main(String[] args) {
        // Get current profile
        String profile = System.getProperty(AbstractEnvironment.ACTIVE_PROFILES_PROPERTY_NAME, "dev");

        // Only load dotenv in dev
        if (profile.equals("dev")) {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing() // prevents crash if .env missing
                    .load();
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        }

        SpringApplication.run(NxtApplication.class, args);
    }
}
