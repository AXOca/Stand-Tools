import os
import shutil
import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, 
    QMessageBox, QInputDialog, QComboBox, QSpacerItem, QSizePolicy, QFileDialog, QCheckBox, QDialog, QDialogButtonBox, QFormLayout, QListWidget, QListWidgetItem
)
from PyQt5.QtGui import QClipboard, QFont, QPalette, QColor, QMovie
from PyQt5.QtCore import Qt, QFileSystemWatcher
from PyQt5.QtWidgets import QGraphicsOpacityEffect

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for build """
    return os.path.join(os.path.dirname(__file__), relative_path)

class StandSupportTool(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Stand Support Tool")
        self.setFixedSize(600, 400)  # Set fixed size to make the GUI non-resizable
        
        self.watcher = QFileSystemWatcher(self)  # Initialize file system watcher
        
        self.init_ui()
        self.update_current_protocol()
        self.update_activation_key()
        
        self.watch_activation_key_file()  # Start watching the activation key file

    def init_ui(self):
        widget = QWidget()
        main_layout = QVBoxLayout(widget)

        # Set up the GIF background
        self.gif_label = QLabel(widget)
        self.gif_movie = QMovie(resource_path("cat-spinning.gif"))
        self.gif_label.setMovie(self.gif_movie)
        self.gif_movie.start()
        self.gif_label.setFixedSize(self.width(), self.height())
        self.gif_label.setScaledContents(True)

        opacity_effect = QGraphicsOpacityEffect()
        opacity_effect.setOpacity(0.40)  # Set opacity to 40%
        self.gif_label.setGraphicsEffect(opacity_effect)
        self.gif_label.lower()

        font = QFont()
        font.setPointSize(12)
        self.setFont(font)

        palette = QPalette()
        palette.setColor(QPalette.Window, QColor(255, 240, 245))
        palette.setColor(QPalette.WindowText, Qt.black)
        palette.setColor(QPalette.Base, QColor(255, 255, 255))
        palette.setColor(QPalette.AlternateBase, QColor(245, 220, 235))
        palette.setColor(QPalette.ToolTipBase, Qt.white)
        palette.setColor(QPalette.ToolTipText, Qt.black)
        palette.setColor(QPalette.Text, Qt.black)
        palette.setColor(QPalette.Button, QColor(255, 182, 193))
        palette.setColor(QPalette.ButtonText, Qt.black)
        palette.setColor(QPalette.BrightText, Qt.red)
        palette.setColor(QPalette.Highlight, QColor(255, 105, 180))
        palette.setColor(QPalette.HighlightedText, Qt.black)
        self.setPalette(palette)

        overlay_layout = QVBoxLayout()

        full_reset_btn = QPushButton("Full Reset")
        full_reset_btn.clicked.connect(self.full_reset)
        overlay_layout.addWidget(full_reset_btn)

        clear_cache_btn = QPushButton("Clear Cache")
        clear_cache_btn.clicked.connect(self.clear_cache)
        overlay_layout.addWidget(clear_cache_btn)
        
        protocol_layout = QHBoxLayout()
        protocol_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        self.protocol_dropdown = QComboBox()
        self.protocol_dropdown.addItems(["SMART", "OS", "HTTP", "UDP"])
        self.protocol_dropdown.setCurrentText(self.get_current_protocol())
        protocol_layout.addWidget(self.protocol_dropdown)

        switch_protocol_btn = QPushButton("Switch Protocol")
        switch_protocol_btn.clicked.connect(self.switch_protocol)
        protocol_layout.addWidget(switch_protocol_btn)

        self.protocol_label = QLabel("Current Protocol: Unknown")
        protocol_layout.addWidget(self.protocol_label)
        protocol_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        overlay_layout.addLayout(protocol_layout)

        log_btn_layout = QHBoxLayout()
        log_btn_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        copy_log_btn = QPushButton("Copy Log to Clipboard")
        copy_log_btn.clicked.connect(self.copy_log_to_clipboard)
        log_btn_layout.addWidget(copy_log_btn)
        log_btn_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        overlay_layout.addLayout(log_btn_layout)

        profile_btn_layout = QHBoxLayout()
        profile_btn_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        copy_profile_btn = QPushButton("Copy Profile to Clipboard")
        copy_profile_btn.clicked.connect(self.copy_profile_to_clipboard)
        profile_btn_layout.addWidget(copy_profile_btn)
        profile_btn_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        overlay_layout.addLayout(profile_btn_layout)

        activation_key_layout = QHBoxLayout()
        activation_key_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        set_activation_key_btn = QPushButton("Set Activation Key")
        set_activation_key_btn.clicked.connect(self.set_activation_key)
        activation_key_layout.addWidget(set_activation_key_btn)

        self.activation_key_label = QLabel("Activation Key: None")
        activation_key_layout.addWidget(self.activation_key_label)
        activation_key_layout.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Expanding, QSizePolicy.Minimum))
        overlay_layout.addLayout(activation_key_layout)

        main_layout.addWidget(self.gif_label)
        main_layout.addLayout(overlay_layout)
        widget.setLayout(main_layout)
        self.setCentralWidget(widget)

    def full_reset(self):
        reply = QMessageBox.question(self, "Initial Prompt", "Please close GTA V and Stand's Launchpad. Continue?", 
                                    QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply != QMessageBox.Yes:
            return

        reply = QMessageBox.question(self, "Confirmation Dialog", "Are you sure you want to do that? All your outfits and individual settings will be lost.", 
                                    QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel, QMessageBox.Cancel)
        if reply == QMessageBox.Cancel:
            return
        elif reply == QMessageBox.Yes:
            backup_reply = QMessageBox.question(self, "Backup Choice", "Do you want to back it up first?", 
                                                QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel, QMessageBox.Cancel)
            if backup_reply == QMessageBox.Cancel:
                return
            elif backup_reply == QMessageBox.Yes:
                success = self.backup_stand_data()
                if not success:  # If the backup failed
                    return
            self.delete_stand_data()
        else:
            QMessageBox.information(self, "Aborted", "Full reset aborted.")

    def clear_cache(self):
        reply = QMessageBox.question(self, "Clear Cache", "Please close Stand's Launchpad before continuing. Continue?", 
                                     QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply != QMessageBox.Yes:
            return

        try:
            paths_to_delete = [
                os.path.join(os.environ['APPDATA'], 'Stand', 'Cache'),
                os.path.join(os.environ['APPDATA'], 'Stand', 'Bin'),
                os.path.join(os.environ['PROGRAMDATA'], 'Calamity, Inc'),
                os.path.join(os.environ['LOCALAPPDATA'], 'Calamity,_Inc')
            ]

            for path in paths_to_delete:
                if os.path.exists(path):
                    shutil.rmtree(path)
            QMessageBox.information(self, "Success", "Cache cleared successfully.")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to clear cache: {e}")

    def backup_stand_data(self):
        try:
            stand_dir = os.path.join(os.environ['APPDATA'], 'Stand')
            items_to_backup = self.select_items_to_backup(stand_dir)
            if not items_to_backup:
                return False
            
            desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
            backup_dir = os.path.join(desktop, 'Stand_BackUp')
            os.makedirs(backup_dir, exist_ok=True)

            for item in items_to_backup:
                item_path = os.path.join(stand_dir, item)
                if os.path.isdir(item_path):
                    shutil.copytree(item_path, os.path.join(backup_dir, item), dirs_exist_ok=True)
                else:
                    shutil.copy2(item_path, os.path.join(backup_dir, item))
            QMessageBox.information(self, "Success", "Backup completed successfully.")
            return True
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to backup Stand data: {e}")
            return False

    def select_items_to_backup(self, stand_dir):
        dialog = QDialog(self)
        dialog.setWindowTitle("Select Items to Backup")
        dialog.setGeometry(100, 100, 400, 300)
        
        layout = QVBoxLayout(dialog)
        
        form_layout = QFormLayout()
        list_widget = QListWidget()

        # Separate folders and files, and sort them
        folders = sorted([f for f in os.listdir(stand_dir) if os.path.isdir(os.path.join(stand_dir, f))])
        files = sorted([f for f in os.listdir(stand_dir) if os.path.isfile(os.path.join(stand_dir, f))])

        for folder in folders:
            list_item = QListWidgetItem(f"[Folder] {folder}")
            list_item.setCheckState(Qt.Unchecked)
            list_widget.addItem(list_item)

        for file in files:
            list_item = QListWidgetItem(f"[File] {file}")
            list_item.setCheckState(Qt.Unchecked)
            list_widget.addItem(list_item)

        form_layout.addRow(list_widget)
        layout.addLayout(form_layout)
        
        button_box = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        button_box.accepted.connect(dialog.accept)
        button_box.rejected.connect(dialog.reject)
        layout.addWidget(button_box)
        
        dialog.setLayout(layout)
        
        if dialog.exec() == QDialog.Accepted:
            return [list_widget.item(i).text().split(" ", 1)[1] for i in range(list_widget.count()) if list_widget.item(i).checkState() == Qt.Checked]
        return None

    def delete_stand_data(self):
        try:
            stand_dir = os.path.join(os.environ['APPDATA'], 'Stand')
            if os.path.exists(stand_dir):
                shutil.rmtree(stand_dir)
            os.makedirs(stand_dir)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to delete Stand data: {e}")

    def switch_protocol(self):
        protocol = self.protocol_dropdown.currentText()
        self.set_protocol(protocol)
        self.update_current_protocol()

    def get_current_protocol(self):
        try:
            state_file = os.path.join(os.environ['APPDATA'], 'Stand', 'Meta State.txt')
            default_protocol = "SMART"

            if os.path.exists(state_file):
                with open(state_file, 'r') as f:
                    lines = f.readlines()
                    for line in lines:
                        if line.startswith("DNS Conduit:"):
                            return line.split(":")[1].strip()
            
            return default_protocol
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to get current protocol: {e}")
            return "Unknown"

    def set_protocol(self, protocol):
        try:
            stand_dir = os.path.join(os.environ['APPDATA'], 'Stand')
            state_file = os.path.join(stand_dir, 'Meta State.txt')

            # Create directory and file if they do not exist
            if not os.path.exists(stand_dir):
                os.makedirs(stand_dir)

            if not os.path.exists(state_file):
                with open(state_file, 'w') as f:
                    f.write("")

            lines = []
            if os.path.exists(state_file):
                with open(state_file, 'r') as f:
                    lines = f.readlines()

            with open(state_file, 'w') as f:
                found = False
                for line in lines:
                    if line.startswith("DNS Conduit:"):
                        f.write(f"DNS Conduit: {protocol}\n")
                        found = True
                    else:
                        f.write(line)
                if not found:
                    f.write(f"DNS Conduit: {protocol}\n")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to set protocol: {e}")

    def update_current_protocol(self):
        current_protocol = self.get_current_protocol()
        self.protocol_label.setText(f"Current Protocol: {current_protocol}")

    def get_activation_key(self):
        try:
            activation_key_file = os.path.join(os.environ['APPDATA'], 'Stand', 'Activation Key.txt')
            
            if os.path.exists(activation_key_file):
                with open(activation_key_file, 'r') as f:
                    key = f.read().strip()
                    return key if key else "None"
            return "None"
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to get activation key: {e}")
            return "None"

    def update_activation_key(self):
        current_key = self.get_activation_key()
        self.activation_key_label.setText(f"Activation Key: {current_key}")

    def watch_activation_key_file(self):
        activation_key_file = os.path.join(os.environ['APPDATA'], 'Stand', 'Activation Key.txt')
        if os.path.exists(activation_key_file):
            self.watcher.addPath(activation_key_file)
            self.watcher.fileChanged.connect(self.update_activation_key)

    def copy_log_to_clipboard(self):
        try:
            log_file = os.path.join(os.environ['APPDATA'], 'Stand', 'Log.txt')

            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    lines = f.readlines()
                    if os.path.getsize(log_file) < 25 * 1024 * 1024:  # 25MB
                        log_content = ''.join(lines)
                    else:
                        log_content = ''.join(lines[-40:])
                    clipboard = QApplication.clipboard()
                    clipboard.setText(log_content)
                    QMessageBox.information(self, "Copied", "Log has been copied to clipboard.")
            else:
                QMessageBox.critical(self, "Error", "Log file does not exist.")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to copy log to clipboard: {e}")

    def copy_profile_to_clipboard(self):
        try:
            profiles_dir = os.path.join(os.environ['APPDATA'], 'Stand', 'Profiles')
            
            if os.path.exists(profiles_dir):
                profile_files = [f for f in os.listdir(profiles_dir) if os.path.isfile(os.path.join(profiles_dir, f))]

                if not profile_files:
                    QMessageBox.information(self, "No Profiles", "No profiles found.")
                    return

                profile_choice, ok = QInputDialog.getItem(self, "Copy Profile to Clipboard", "Choose Profile:", profile_files, 0, False)
                
                if ok and profile_choice in profile_files:
                    profile_file_path = os.path.join(profiles_dir, profile_choice)
                    with open(profile_file_path, 'r') as f:
                        profile_content = f.read()
                        clipboard = QApplication.clipboard()
                        clipboard.setText(profile_content)
                        QMessageBox.information(self, "Copied", "Profile has been copied to clipboard.")
            else:
                QMessageBox.critical(self, "Error", "Profiles directory does not exist.")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to copy profile to clipboard: {e}")

    def set_activation_key(self):
        try:
            stand_dir = os.path.join(os.environ['APPDATA'], 'Stand')
            activation_key_file = os.path.join(stand_dir, 'Activation Key.txt')
            
            if not os.path.exists(stand_dir):
                os.makedirs(stand_dir)

            current_key = ""
            if os.path.exists(activation_key_file):
                with open(activation_key_file, 'r') as f:
                    current_key = f.read().strip()

            activation_key, ok = QInputDialog.getText(self, "Set Activation Key", "Enter Activation Key:", text=current_key)

            if ok and activation_key:
                if not activation_key.startswith("Stand-Activate-") or not activation_key[len("Stand-Activate-"):].islower():
                    QMessageBox.critical(self, "Error", "Something went wrong. This does not look like an Activation Key. Make sure to copy the 'Stand-Activate-' part as well and ensure the rest is in lowercase.")
                else:
                    with open(activation_key_file, 'w') as f:
                        f.write(activation_key)
                    QMessageBox.information(self, "Success", "Activation Key set successfully.")
                    self.update_activation_key()
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to set activation key: {e}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    mainWin = StandSupportTool()
    mainWin.show()
    sys.exit(app.exec_())
