#include "../mem.hpp"

#ifdef TRACY_MEMORY
void* operator new(std::size_t count)
{
    // NOLINTBEGIN(cppcoreguidelines-no-malloc)
    void* ptr = malloc(count);
    // NOLINTEND(cppcoreguidelines-no-malloc)
#ifdef TRACY_ALLOC
    TRACY_ALLOC(ptr, count);
#endif
    return ptr;
}

void* operator new[](std::size_t count)
{
    // NOLINTBEGIN(cppcoreguidelines-no-malloc)
    void* ptr = malloc(count);
    // NOLINTEND(cppcoreguidelines-no-malloc)
#ifdef TRACY_ALLOC
    TRACY_ALLOC(ptr, count);
#endif
    return ptr;
}

void operator delete(void* ptr) noexcept
{
#ifdef TRACY_FREE
    TRACY_FREE(ptr);
#endif
    // NOLINTBEGIN(cppcoreguidelines-no-malloc)
    free(ptr);
    // NOLINTEND(cppcoreguidelines-no-malloc)
}

void operator delete(void* ptr, std::size_t) noexcept
{
#ifdef TRACY_FREE
    TRACY_FREE(ptr);
#endif
    // NOLINTBEGIN(cppcoreguidelines-no-malloc)
    free(ptr);
    // NOLINTEND(cppcoreguidelines-no-malloc)
}

void operator delete[](void* ptr) noexcept
{
#ifdef TRACY_FREE
    TRACY_FREE(ptr);
#endif
    // NOLINTBEGIN(cppcoreguidelines-no-malloc)
    free(ptr);
    // NOLINTEND(cppcoreguidelines-no-malloc)
}

void operator delete[](void* ptr, std::size_t) noexcept
{
#ifdef TRACY_FREE
    TRACY_FREE(ptr);
#endif
    // NOLINTBEGIN(cppcoreguidelines-no-malloc)
    free(ptr);
    // NOLINTEND(cppcoreguidelines-no-malloc)
}

// C++17 aligned new
void* operator new(std::size_t size, std::align_val_t alignment)
{
    return aligned_alloc(static_cast<std::size_t>(alignment), size);
}

void operator delete(void* ptr, std::align_val_t) noexcept
{
    aligned_free(ptr);
}

#else
void __ensure_object_file_not_empty_of_symbols() {} // NOLINT
#endif
