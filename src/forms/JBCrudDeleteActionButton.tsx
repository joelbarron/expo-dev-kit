// @ts-nocheck
import { getColor } from "../utils/colors";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Box } from "../ui/box";
import { Button, ButtonIcon, ButtonText } from "../ui/button";

interface CrudDeleteActionButtonProps {
  isNew: boolean;
  formEnabled: boolean;
  crudActionsDisabled?: boolean;
  allowDelete?: boolean;
  onDeletePress?: () => void;
  containerClassName?: string;
  buttonClassName?: string;
  textClassName?: string;
}

export const CrudDeleteActionButton = ({
  isNew,
  formEnabled,
  crudActionsDisabled,
  allowDelete = false,
  onDeletePress,
  containerClassName = "",
  buttonClassName = "p-3",
  textClassName = "text-red-500",
}: CrudDeleteActionButtonProps) => {
  const redColor = getColor("red");

  return (
    <Box className={`w-full ${containerClassName}`}>
      {formEnabled && !isNew && (
        <Button
          size="xl"
          variant="link"
          className={buttonClassName}
          onPress={onDeletePress}
          isDisabled={crudActionsDisabled}
        >
          <ButtonText className={textClassName}>Eliminar</ButtonText>
          <ButtonIcon
            as={() => (
              <MaterialIcons name="delete" size={18} color={redColor[500]} />
            )}
          />
        </Button>
      )}
    </Box>
  );
};
