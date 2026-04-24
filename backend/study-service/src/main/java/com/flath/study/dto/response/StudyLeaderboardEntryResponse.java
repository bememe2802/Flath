package com.flath.study.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudyLeaderboardEntryResponse {
    String userId;
    String username;
    String firstName;
    String lastName;
    String avatar;
    String city;
    long totalSeconds;
    long weekSeconds;
    int streakDays;
}
