package com.flath.post.mapper;

import com.flath.post.dto.response.PostResponse;
import com.flath.post.entity.Post;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PostMapper {
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "created", ignore = true)
    @Mapping(target = "likeCount", ignore = true)
    @Mapping(target = "commentCount", ignore = true)
    @Mapping(target = "shareCount", ignore = true)
    @Mapping(target = "likedByMe", ignore = true)
    @Mapping(target = "sharedPost", ignore = true)
    PostResponse toPostResponse(Post post);
}
