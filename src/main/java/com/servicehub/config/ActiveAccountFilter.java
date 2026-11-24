
package com.servicehub.config;

import com.servicehub.model.User;
import com.servicehub.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class ActiveAccountFilter extends OncePerRequestFilter {

    private final UserRepository users;

    public ActiveAccountFilter(UserRepository users) {
        this.users = users;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {

            User user = users.findByEmail(authentication.getName())
                    .orElse(null);

            if (user == null || user.isBlocked()) {
                SecurityContextHolder.clearContext();

                var session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }

                response.sendError(
                        user == null
                                ? HttpServletResponse.SC_UNAUTHORIZED
                                : HttpServletResponse.SC_FORBIDDEN,
                        user == null
                                ? "Account not found"
                                : "Account suspended"
                );
                return;
            }

            String expectedRole = "ROLE_" + user.getRole();

            boolean roleMatches = authentication.getAuthorities()
                    .stream()
                    .anyMatch(authority ->
                            expectedRole.equals(authority.getAuthority())
                    );

            if (!roleMatches || authentication.getAuthorities().size() != 1) {
                SecurityContextHolder.clearContext();

                var session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }

                response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Account permissions changed. Please log in again."
                );
                return;
            }
        }

        chain.doFilter(request, response);
    }
}

