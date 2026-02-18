// @ts-nocheck
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ConfirmationDialog } from "../shared/ConfirmationDialog";
import { Button, ButtonIcon, ButtonText } from "../ui/button";
import { HStack } from "../ui/hstack";

interface CrudActionButtonsProps {
  isNew: boolean;
  formEnabled: boolean;
  crudActionsDisabled?: boolean;
  onEditPress?: () => void;
  onCancelEditPress?: () => void;
  onSavePress?: () => void;
  allowDelete?: boolean;
  onDeletePress?: () => void;
  containerClassName?: string;
  saveButtonClassName?: string;
  saveTextClassName?: string;
  deleteButtonClassName?: string;
  editButtonClassName?: string;
  editTextClassName?: string;
}

export const CrudActionButtons = ({
  isNew,
  formEnabled,
  crudActionsDisabled,
  onEditPress,
  onCancelEditPress,
  onSavePress,
  allowDelete = false,
  onDeletePress = () => {},
  containerClassName = "",
  saveButtonClassName = "flex-1 rounded-xl",
  saveTextClassName = "text-white",
  deleteButtonClassName = "rounded-xl",
  editButtonClassName = "flex-1",
  editTextClassName = "text-white",
}: CrudActionButtonsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  return (
    <>
      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onAgree={onDeletePress}
      />

      <HStack
        className={`flex-1 h-full pt-6 justify-between ${containerClassName}`}
        space="md"
      >
        {formEnabled && !isNew && (
          <>
            {/* delete */}
            <Button
              size="xl"
              variant="solid"
              className={deleteButtonClassName}
              action="negative"
              // className="rounded-full p-3 bg-background-0"
              onPress={() => setDeleteDialogOpen(true)}
              isDisabled={crudActionsDisabled}
            >
              <ButtonIcon
                as={() => (
                  <MaterialIcons name="delete" size={20} color="white" />
                )}
              />
            </Button>
            {/* cancel */}
            {/* <Button
            size="xl"
            variant="outline"
            className="flex-1"
            action="primary"
            // className="rounded-full p-3 bg-background-0"
            onPress={onCancelEditPress}
            isDisabled={crudActionsDisabled}
          >
            <ButtonText className="text-primary-500">Cancelar</ButtonText>
          </Button> */}
          </>
        )}

        {/* save */}
        {formEnabled && (
          <Button
            size="xl"
            // className={`p-3 ${!isNew ? "w-full" : "w-[50%]"}`}
            className={saveButtonClassName}
            action="primary"
            onPress={onSavePress}
            isDisabled={crudActionsDisabled}
          >
            <ButtonText className={saveTextClassName} size="xl">
              Guardar
            </ButtonText>
            <ButtonIcon
              as={() => <MaterialIcons name="save" size={20} color="white" />}
            />
          </Button>
        )}

        {/* edit */}
        {!formEnabled && (
          <Button size="xl" className={editButtonClassName} onPress={onEditPress}>
            <ButtonText className={editTextClassName} size="xl">
              Editar
            </ButtonText>
            <ButtonIcon
              as={() => <MaterialIcons name="edit" size={20} color="white" />}
            />
          </Button>
        )}
      </HStack>
    </>
  );
};
