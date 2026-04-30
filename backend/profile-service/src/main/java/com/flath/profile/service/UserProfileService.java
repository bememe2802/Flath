package com.flath.profile.service;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.flath.profile.dto.request.ProfileCreationRequest;
import com.flath.profile.dto.request.SearchUserRequest;
import com.flath.profile.dto.request.UpdateProfileRequest;
import com.flath.profile.dto.response.UserProfileResponse;
import com.flath.profile.entity.UserProfile;
import com.flath.profile.exception.AppException;
import com.flath.profile.exception.ErrorCode;
import com.flath.profile.mapper.UserProfileMapper;
import com.flath.profile.repository.UserProfileRepository;
import com.flath.profile.repository.httpclient.FileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    FileClient fileClient;
    UserProfileMapper userProfileMapper;
    ProfileCacheService profileCacheService;

    public UserProfileResponse createProfile(ProfileCreationRequest request) {
        UserProfile userProfile = userProfileMapper.toUserProfile(request);
        userProfile = userProfileRepository.save(userProfile);
        UserProfileResponse response = userProfileMapper.toUserProfileResponse(userProfile);
        profileCacheService.put(response);
        return response;
    }

    public UserProfileResponse getByUserId(String userId) {
        var cachedProfile = profileCacheService.getByUserId(userId);
        if (cachedProfile.isPresent()) {
            return cachedProfile.get();
        }

        UserProfile userProfile = userProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        UserProfileResponse response = userProfileMapper.toUserProfileResponse(userProfile);
        profileCacheService.put(response);
        return response;
    }

    public UserProfileResponse getProfile(String id) {
        UserProfile userProfile =
                userProfileRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllProfiles() {
        var profiles = userProfileRepository.findAll();

        return profiles.stream().map(userProfileMapper::toUserProfileResponse).toList();
    }

    public List<UserProfileResponse> getAllProfilesInternal() {
        return userProfileRepository.findAll().stream()
                .map(userProfileMapper::toUserProfileResponse)
                .toList();
    }

    public UserProfileResponse getMyProfile() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        return getByUserId(userId);
    }

    public UserProfileResponse updateMyProfile(UpdateProfileRequest request) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userProfileMapper.update(profile, request);
        UserProfileResponse response = userProfileMapper.toUserProfileResponse(userProfileRepository.save(profile));
        profileCacheService.put(response);
        return response;
    }

    public UserProfileResponse updateAvatar(MultipartFile file) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository
                .findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        var response = fileClient.uploadMedia(file);

        profile.setAvatar(response.getResult().getUrl());
        UserProfileResponse profileResponse =
                userProfileMapper.toUserProfileResponse(userProfileRepository.save(profile));
        profileCacheService.put(profileResponse);
        return profileResponse;
    }

    public List<UserProfileResponse> search(SearchUserRequest request) {
        var userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<UserProfile> userProfiles = userProfileRepository.findAllByUsernameLike(request.getKeyword());
        return userProfiles.stream()
                .filter(userProfile -> !userId.equals(userProfile.getUserId()))
                .map(userProfileMapper::toUserProfileResponse)
                .toList();
    }
}
