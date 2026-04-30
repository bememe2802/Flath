package com.flath.notification.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.flath.notification.entity.InAppNotification;

@Repository
public interface InAppNotificationRepository extends MongoRepository<InAppNotification, String> {
    List<InAppNotification> findTop20ByRecipientUserIdOrderByCreatedDateDesc(String recipientUserId);

    long countByRecipientUserIdAndReadFalse(String recipientUserId);

    List<InAppNotification> findAllByRecipientUserIdAndReadFalse(String recipientUserId);

    boolean existsByEventKey(String eventKey);
}
