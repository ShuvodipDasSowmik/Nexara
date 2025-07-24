package com.nxt.nxt.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JWTUtil jwtUtil;

    public JwtAuthFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private static final String[] PUBLIC_URLS = {"/", "/api/auth/**"};
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

        String token = null;

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null) {
            String username = jwtUtil.extractUsername(token);

            if (jwtUtil.isValidToken(token, username)) {

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username, null, List.of());

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
            
            else {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                return;
            }
        }
        
        else {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No token provided");
            return;
        }

        filterChain.doFilter(request, response);
    }

}
