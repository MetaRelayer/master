import React from "react";

const ButtonComponent = ({
    children,
    onClick,
    className,
    type,
    title,
    bgColor,
    color,
    btnPrimary,
    btnSecondary,
    btnSuccess,
    btnDanger,
    disabled,
    btnSm,
    btnInfo,
    extraClass,
    style,
    preFixIcon,
    postFixIcon,
    peNone,
    buttonRef,
    loading,
    ...rest
}: any) => {
    return (
        <button
            disabled={loading ? loading : disabled}
            title={title}
            type={type}
            ref={buttonRef}
            className={className}
            onClick={onClick}
            style={style}
            {...rest}
        >
            {preFixIcon}
            {children}
            {postFixIcon}
        </button>
    );
};

export default ButtonComponent;