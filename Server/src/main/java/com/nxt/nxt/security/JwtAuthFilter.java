package com.nxt.nxt.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nxt.nxt.entity.User;
import com.nxt.nxt.repositories.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JWTUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthFilter(JWTUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    // Make only the summarize endpoint public instead of all /api/tools/**
    private static final String[] PUBLIC_URLS = {
        "/",
        "/api/auth/**",
        "/api/admin/signup",
        "/api/admin/signin", 
        "/api/tools/summarize-youtube-transcript",
        "/api/admin/track-activity",
    };
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        for (String publicUrl : PUBLIC_URLS) {
            if (pathMatcher.match(publicUrl, request.getServletPath())) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // If this is a public path, skip auth checks immediately
        for (String publicUrl : PUBLIC_URLS) {
            if (pathMatcher.match(publicUrl, request.getServletPath())) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        String token = null;

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    // System.out.println("Access token: " + token);
                    break;
                }
            }
        }

        if (token != null) {
            String username = jwtUtil.extractUsername(token);

            if (jwtUtil.isValidToken(token, username)) {
                // Verify user exists in users table
                Optional<User> userOpt = userRepository.findByUsername(username);

                if (userOpt.isPresent()) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, List.of());

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User not found");
                    return;
                }
            } else {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                return;
            }
        } else {
            System.out.println("No token provided");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No token provided");
            return;
        }

        filterChain.doFilter(request, response);
    }

}
