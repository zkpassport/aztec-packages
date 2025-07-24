#include "barretenberg/polynomials/backing_memory.hpp"
#include <cstdlib>
#include <string>

bool is_slow_low_memory_enabled() {
    const char* env_val = std::getenv("BB_SLOW_LOW_MEMORY");
    return env_val != nullptr && std::string(env_val) == "1";
}

void set_slow_low_memory(bool enabled) {
    if (enabled) {
        setenv("BB_SLOW_LOW_MEMORY", "1", 1);
    } else {
        unsetenv("BB_SLOW_LOW_MEMORY");
    }
}
