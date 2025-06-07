
import React, { useState } from "react";
import { Folder, FolderPlus, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FolderShareDialog from "./FolderShareDialog";

interface FolderSelectorProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onCreateFolder: (folder: string) => void;
  sharedFolders?: string[];
  onFolderShared?: () => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  sharedFolders = [],
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

  const isSharedFolder = (folderName: string) => {
    return sharedFolders.includes(folderName);
  };

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
          <div key={folder} className="flex items-center gap-1">
            <Button
              variant={selectedFolder === folder ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectFolder(folder)}
              className="flex items-center gap-1"
            >
              {isSharedFolder(folder) ? (
                <Users className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
              {folder}
              {isSharedFolder(folder) && (
                <span className="text-xs opacity-75">(shared)</span>
              )}
            </Button>
            
            {!isSharedFolder(folder) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShareFolder(folder)}
                className="h-7 w-7 p-0"
                title={`Share "${folder}" folder`}
              >
                <Share2 className="h-3 w-3" />
              </Button>
            )}
          </div>
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
