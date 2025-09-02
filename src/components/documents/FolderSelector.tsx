
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
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Folders
        </h2>
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant={selectedFolder === "" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectFolder("")}
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <Folder className="h-4 w-4" />
            All Documents
          </Button>
          
          {folders.map((folder) => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectFolder(folder)}
              className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <Folder className="h-4 w-4" />
              {folder}
            </Button>
          ))}
          
          {creating ? (
            <form
              className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-left-2 duration-200"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <input
                className="border border-input bg-background rounded-md px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="Folder name"
                autoFocus
                maxLength={30}
              />
              <Button 
                type="submit" 
                size="sm" 
                className="px-2"
                disabled={!newFolder.trim() || folders.includes(newFolder.trim())}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          )}
        </div>
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
