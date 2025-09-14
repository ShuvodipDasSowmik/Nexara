package com.nxt.nxt.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

    private final Environment env;

    public MailConfig(Environment env) {
        this.env = env;
    }

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        String host = env.getProperty("spring.mail.host", "localhost");
        int port = Integer.parseInt(env.getProperty("spring.mail.port", "25"));
        String username = env.getProperty("spring.mail.username");
        String password = env.getProperty("spring.mail.password");

        mailSender.setHost(host);
        mailSender.setPort(port);
        if (username != null) mailSender.setUsername(username);
        if (password != null) mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", env.getProperty("spring.mail.protocol", "smtp"));
        props.put("mail.smtp.auth", env.getProperty("spring.mail.properties.mail.smtp.auth", "false"));
        props.put("mail.smtp.starttls.enable", env.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "false"));
        props.put("mail.debug", env.getProperty("spring.mail.properties.mail.debug", "false"));

        return mailSender;
    }
}
