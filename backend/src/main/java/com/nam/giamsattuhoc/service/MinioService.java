package com.nam.giamsattuhoc.service;

import io.minio.*;
import io.minio.http.Method;
import io.minio.messages.Item;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    public void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Bucket '{}' created", bucketName);
            }
        } catch (Exception e) {
            log.error("Error ensuring bucket exists", e);
            throw new RuntimeException("MinIO bucket error", e);
        }
    }

    /**
     * Upload clip evidence.
     * objectName: e.g. "nguyenvana_CNWEB_23-05-2026/drowsy/clip_14h22m30s.webm"
     */
    public String uploadFile(MultipartFile file, String objectName) {
        try {
            ensureBucketExists();
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType() != null ? file.getContentType() : "video/webm")
                    .build());
            log.info("Uploaded: {}", objectName);
            return objectName;
        } catch (Exception e) {
            log.error("Upload failed: {}", objectName, e);
            throw new RuntimeException("Upload to MinIO failed", e);
        }
    }

    public String uploadInputStream(InputStream stream, long size, String objectName, String contentType) {
        try {
            ensureBucketExists();
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(stream, size, -1)
                    .contentType(contentType)
                    .build());
            return objectName;
        } catch (Exception e) {
            log.error("Upload stream failed: {}", objectName, e);
            throw new RuntimeException("Upload to MinIO failed", e);
        }
    }

    /**
     * Tạo presigned URL có hiệu lực 1 giờ để GV xem video.
     */
    public String getPresignedUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .method(Method.GET)
                    .expiry(1, TimeUnit.HOURS)
                    .build());
        } catch (Exception e) {
            log.error("Error generating presigned URL for: {}", objectName, e);
            throw new RuntimeException("Cannot generate presigned URL", e);
        }
    }

    public List<String> listObjects(String prefix) {
        List<String> result = new ArrayList<>();
        try {
            Iterable<Result<Item>> items = minioClient.listObjects(
                    ListObjectsArgs.builder().bucket(bucketName).prefix(prefix).recursive(true).build());
            for (Result<Item> item : items) {
                result.add(item.get().objectName());
            }
        } catch (Exception e) {
            log.error("Error listing objects with prefix: {}", prefix, e);
        }
        return result;
    }

    public void deleteObject(String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucketName).object(objectName).build());
        } catch (Exception e) {
            log.error("Error deleting object: {}", objectName, e);
        }
    }
}
