
import React, { useState } from "react";
import { Folder, FolderPlus, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FolderShareDialog from "./FolderShareDialog";

interface FolderSelectorProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onCreateFolder: (folder: string) => void;
  onFolderShared?: () => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onFolderShared,
}) => {
  const [newFolder, setNewFolder] = useState("");
  const [creating, setCreating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [folderToShare, setFolderToShare] = useState("");

  const handleCreate = () => {
    const trimmed = newFolder.trim();
    if (trimmed && !folders.includes(trimmed)) {
      onCreateFolder(trimmed);
      setNewFolder("");
      setCreating(false);
    }
  };

  const handleShareFolder = (folderName: string) => {
    setFolderToShare(folderName);
    setShareDialogOpen(true);
  };

  // Remove shared folder functionality for now as it's replaced by team-based access

  return (
    <>
      <div className="mb-4 flex items-center flex-wrap gap-2">
        <Button
          variant={selectedFolder === "" ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectFolder("")}
          className="flex items-center gap-1"
        >
          <Folder className="h-4 w-4" />
          All
        </Button>
        
        {folders.map((folder) => (
          <Button
            key={folder}
            variant={selectedFolder === folder ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectFolder(folder)}
            className="flex items-center gap-1"
          >
            <Folder className="h-4 w-4" />
            {folder}
          </Button>
        ))}
        
        {creating ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <input
              className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="New folder"
              autoFocus
              maxLength={30}
            />
            <Button type="submit" size="icon" className="h-7 w-7" variant="ghost">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCreating(true)}
            className="h-7 w-7"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <FolderShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        folderName={folderToShare}
        onFolderShared={onFolderShared}
      />
    </>
  );
};

export default FolderSelector;
