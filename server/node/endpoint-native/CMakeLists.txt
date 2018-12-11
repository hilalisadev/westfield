cmake_minimum_required(VERSION 3.10)

function(PARSE_CMAKEJS_PROPERTIES)
    function(GET_VARIABLE INPUT_STRING VARIABLE_TO_SELECT OUTPUT_VARIABLE)
        set(SEARCH_STRING "${VARIABLE_TO_SELECT}=\"")
        string(LENGTH "${SEARCH_STRING}" SEARCH_STRING_LENGTH)
        string(LENGTH "${INPUT_STRING}" INPUT_STRING_LENGTH)

        string(FIND "${INPUT_STRING}" "${VARIABLE_TO_SELECT}=\"" SEARCH_STRING_INDEX)

        math(EXPR SEARCH_STRING_INDEX "${SEARCH_STRING_INDEX}+${SEARCH_STRING_LENGTH}")

        string(SUBSTRING "${INPUT_STRING}" ${SEARCH_STRING_INDEX} ${INPUT_STRING_LENGTH} AFTER_SEARCH_STRING)
        string(FIND "${AFTER_SEARCH_STRING}" "\"" QUOTE_INDEX)
        string(SUBSTRING "${AFTER_SEARCH_STRING}" "0" "${QUOTE_INDEX}" RESULT_STRING)
        set("${OUTPUT_VARIABLE}" "${RESULT_STRING}" PARENT_SCOPE)
    endfunction(GET_VARIABLE)

    string(TOLOWER "${CMAKE_BUILD_TYPE}" CMAKE_BUILD_TYPE_LOWER)
    if (CMAKE_BUILD_TYPE_LOWER STREQUAL "debug")
        execute_process(COMMAND "cmake-js" "print-configure" "--debug"
                ${CMAKE_CURRENT_SOURCE_DIR}
                OUTPUT_VARIABLE CMAKE_JS_OUTPUT
                )
    else ()
        execute_process(COMMAND "cmake-js" "print-configure"
                ${CMAKE_CURRENT_SOURCE_DIR}
                OUTPUT_VARIABLE CMAKE_JS_OUTPUT
                )
    endif ()

    get_variable("${CMAKE_JS_OUTPUT}" "CMAKE_JS_INC" CMAKE_JS_INC)
    set(CMAKE_JS_INC "${CMAKE_JS_INC}" PARENT_SCOPE)

    get_variable("${CMAKE_JS_OUTPUT}" "CMAKE_LIBRARY_OUTPUT_DIRECTORY" CMAKE_LIBRARY_OUTPUT_DIRECTORY)
    set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${CMAKE_LIBRARY_OUTPUT_DIRECTORY}" PARENT_SCOPE)

endfunction(PARSE_CMAKEJS_PROPERTIES)

project(westfield-native C)
#set(CMAKE_BUILD_TYPE "debug")

PARSE_CMAKEJS_PROPERTIES()

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake/modules")

find_package(LibFFI REQUIRED)
find_package(Wayland REQUIRED)

add_library(${PROJECT_NAME} SHARED
        src/wayland-server/protocol/wayland-server-protocol.h
        src/wayland-server/protocol/wayland-protocol.c
        src/westfield-native.c
        src/connection.h
        src/wayland-server/connection.c
        src/wayland-server/event-loop.c
        src/wayland-server/wayland-os.h
        src/wayland-server/wayland-os.c
        src/wayland-server/wayland-private.h
        src/wayland-server/wayland-server.h
        src/wayland-server/wayland-server.c
        src/wayland-server/wayland-server-core.h
        src/wayland-server/wayland-shm.c
        src/wayland-server/wayland-util.h
        src/wayland-server/wayland-util.c
        src/westfield-fdutils.c
        src/westfield-fdutils.h
        src/wayland-server-core-extensions.h)

target_include_directories(${PROJECT_NAME}
    PRIVATE ${CMAKE_JS_INC}
    PRIVATE "${CMAKE_SOURCE_DIR}/src/wayland-server/protocol"
    )

set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${LIBFFI_LIBRARIES})