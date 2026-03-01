import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useStore, BottomPanelTab } from '../../store/useStore';

type MenuItem = {
  label: string;
  shortcut?: string;
  divider?: boolean;
  action?: string;
};

type MenuCategory = {
  label: string;
  items: MenuItem[];
};

const menuItems: MenuCategory[] = [
  {
    label: 'File',
    items: [
      { label: 'New File', shortcut: 'Ctrl+N', action: 'new_file' },
      { label: 'New Folder', shortcut: 'Ctrl+Shift+N', action: 'new_folder' },
      { divider: true, label: '' },
      { label: 'Save', shortcut: 'Ctrl+S', action: 'save_workspace' },
      { divider: true, label: '' },
      { label: 'Settings', shortcut: 'Ctrl+,', action: 'open_settings' }
    ]
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Y' },
      { divider: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { divider: true, label: '' },
      { label: 'Find', shortcut: 'Ctrl+F' },
      { label: 'Replace', shortcut: 'Ctrl+H' }
    ]
  },
  {
    label: 'View',
    items: [
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: 'toggle_explorer' },
      { divider: true, label: '' },
      { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: 'open_problems' },
      { label: 'Output', shortcut: 'Ctrl+Shift+U', action: 'open_output' },
      { label: 'Debug Console', shortcut: 'Ctrl+Shift+Y', action: 'open_debug' },
      { label: 'Terminal', shortcut: 'Ctrl+`', action: 'open_terminal' }
    ]
  },
  {
    label: 'Help',
    items: [
      { label: 'Welcome' },
      { label: 'Documentation' },
      { divider: true, label: '' },
      { label: 'About' }
    ]
  }
];

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setBottomPanelOpen, setBottomPanelTab, setSettingsOpen, isFileExplorerOpen, setFileExplorerOpen, updateFile, addFolder, setActiveFile, setOpenFiles, openFiles } = useStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action?: string) => {
    setOpenMenu(null);
    if (!action) return;

    if (action.startsWith('open_') && ['problems', 'output', 'debug', 'terminal', 'ports'].includes(action.replace('open_', ''))) {
      const tab = action.replace('open_', '') as BottomPanelTab;
      setBottomPanelTab(tab);
      setBottomPanelOpen(true);
    } else if (action === 'open_settings') {
      setSettingsOpen(true);
    } else if (action === 'toggle_explorer') {
      setFileExplorerOpen(!isFileExplorerOpen);
    } else if (action === 'new_file') {
      const fileName = prompt('Enter new file name:');
      if (fileName) {
        updateFile(fileName, '');
        if (!openFiles.includes(fileName)) {
          setOpenFiles([...openFiles, fileName]);
        }
        setActiveFile(fileName);
      }
    } else if (action === 'new_folder') {
      const folderName = prompt('Enter new folder name:');
      if (folderName) {
        addFolder(folderName);
      }
    } else if (action === 'save_workspace') {
      // Trigger save (could dispatch an event or just rely on auto-save)
      alert('Workspace saved (simulated)');
    }
  };

  return (
    <div ref={menuRef} className="flex items-center gap-0.5 text-[13px] text-white/80">
      {menuItems.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
            className={cn(
              "px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors cursor-default",
              openMenu === menu.label && "bg-indigo-500/20 text-indigo-300 shadow-inner"
            )}
          >
            {menu.label}
          </button>
          
          {openMenu === menu.label && (
            <div className="absolute top-full left-0 mt-1 w-64 py-1.5 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl z-[100] backdrop-blur-xl">
              {menu.items.map((item, i) => (
                item.divider ? (
                  <div key={i} className="h-px bg-white/10 my-1.5 mx-2" />
                ) : (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between px-4 py-1.5 text-[13px] text-white/80 hover:bg-indigo-500/20 hover:text-white transition-colors"
                    onClick={() => handleAction(item.action)}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-white/40 text-[11px] tracking-wider font-mono">{item.shortcut}</span>
                    )}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}



