package com.nam.giamsattuhoc.util;

import com.nam.giamsattuhoc.entity.User;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret-key}")
    private String secretKey;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public String generateAccessToken(User user) {
        return buildToken(user, accessTokenExpiration);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, refreshTokenExpiration);
    }

    private String buildToken(User user, long expirationSeconds) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(user.getId().toString())
                    .issuer("giamsattuhoc")
                    .issueTime(new Date())
                    .expirationTime(Date.from(Instant.now().plus(expirationSeconds, ChronoUnit.SECONDS)))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("username", user.getUsername())
                    .claim("role", user.getRole().name())
                    .claim("fullName", user.getFullName())
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claims
            );
            signedJWT.sign(new MACSigner(secretKey.getBytes(StandardCharsets.UTF_8)));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Error generating JWT", e);
            throw new RuntimeException("Cannot generate JWT token", e);
        }
    }

    public boolean verifyToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretKey.getBytes(StandardCharsets.UTF_8));
            if (!signedJWT.verify(verifier)) return false;
            return signedJWT.getJWTClaimsSet().getExpirationTime().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public Long extractUserId(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return Long.parseLong(signedJWT.getJWTClaimsSet().getSubject());
        } catch (Exception e) {
            throw new RuntimeException("Cannot extract user id from token");
        }
    }
}
