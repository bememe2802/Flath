package com.flath.notification.controller;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.flath.event.dto.NotificationEvent;
import com.flath.event.dto.PostPublishedEvent;
import com.flath.notification.dto.request.Recipient;
import com.flath.notification.dto.request.SendEmailRequest;
import com.flath.notification.service.EmailService;
import com.flath.notification.service.InAppNotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    EmailService emailService;
    InAppNotificationService inAppNotificationService;

    @KafkaListener(topics = "notification-delivery")
    public void listenNotificationDelivery(NotificationEvent message) {
        log.info("Message received: {}", message);
        emailService.sendEmail(SendEmailRequest.builder()
                .to(Recipient.builder().email(message.getRecipient()).build())
                .subject(message.getSubject())
                .htmlContent(message.getBody())
                .build());
    }

    @KafkaListener(topics = "in-app-notification")
    public void listenInAppNotification(PostPublishedEvent message) {
        log.info("In-app notification received: {}", message);
        inAppNotificationService.createNotificationsForPost(message);
    }
}
