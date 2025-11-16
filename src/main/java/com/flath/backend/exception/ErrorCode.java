package com.flath.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception."),
    KEY_INVALID(1001, "Key invalid."),
    USER_EXISTED(1002, "User existed."),
    USERNAME_INVALID(1003, "Username must be at least 3 characters."),
    PASSWORD_INVALID(1004, "Password must be at least 8 characters."),
    NAME_EMPTY(1005, "Name must not be empty.")
    ;

    private int code;
    private String message;
}
