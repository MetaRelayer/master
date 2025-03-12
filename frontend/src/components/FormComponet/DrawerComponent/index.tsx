import { Drawer } from "antd";

const DrawerComponent = ({
    size,
    title,
    isClosable,
    children,
    onOpen,
    onClose,
}: any) => {
    return (
        <Drawer
            width={size}
            title={title}
            closable={isClosable}
            open={onOpen}
            onClose={onClose}
            footer=""
            maskClosable={false}
        >
            {children && children}
        </Drawer>
    );
};

export default DrawerComponent;