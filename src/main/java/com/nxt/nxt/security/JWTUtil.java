package com.nxt.nxt.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JWTUtil {

    public SecretKey ACCESS_TOKEN_SECRET;

    public SecretKey REFRESH_TOKEN_SECRET;

    public JWTUtil(
        @Value("${jwt.access.secret}") String accessSecret,
        @Value("${jwt.refresh.secret}") String refreshSecret
    )
    {
        this.ACCESS_TOKEN_SECRET = Keys.hmacShaKeyFor(accessSecret.getBytes());
        this.REFRESH_TOKEN_SECRET = Keys.hmacShaKeyFor(refreshSecret.getBytes());
    }

    public String generateAccessToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(ACCESS_TOKEN_SECRET, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(REFRESH_TOKEN_SECRET, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isValidToken(String token, String username) {
        return Jwts.parserBuilder()
                .setSigningKey(ACCESS_TOKEN_SECRET)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject()
                .equals(username);
    }
    

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(ACCESS_TOKEN_SECRET)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }




}
