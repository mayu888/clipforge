# Homebrew Cask Formula for ClipForge
#
# Install: brew install --cask clipforge
#
# For official homebrew-cask submission, submit a PR to:
#   https://github.com/Homebrew/homebrew-cask
#
# Or host as a custom tap:
#   brew tap mayu888/clipforge
#   brew install --cask clipforge

cask "clipforge" do
  version "1.0.0"
  sha256 "YOUR_DMG_SHA256_HERE"

  url "https://github.com/mayu888/clipforge/releases/download/v#{version}/ClipForge-#{version}.dmg"
  name "ClipForge"
  desc "Professional local video and audio processing workstation"
  homepage "https://github.com/mayu888/clipforge"

  depends_on macos: ">= :catalina"

  app "ClipForge.app"

  zap trash: [
    "~/Library/Application Support/ClipForge",
    "~/Library/Caches/ClipForge",
    "~/Library/Logs/ClipForge",
    "~/Library/Preferences/com.mayu888.clipforge.plist",
    "~/Library/Saved Application State/com.mayu888.clipforge.savedState",
  ]
end
