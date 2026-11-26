include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-timecontrol
PKG_VERSION:=1.3.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_MAINTAINER:=OpenWrt Community

LUCI_TITLE:=LuCI support for Time Control
LUCI_DESCRIPTION:=Time-based network access control for devices (ideal for parental control)
# OpenWrt 25.12 uses LuCI with ucode/JavaScript; luci-compat and Lua are not needed
LUCI_DEPENDS:=+nftables +kmod-nft-core +luci-base +rpcd
LUCI_PKGARCH:=all

PKG_BUILD_PARALLEL:=1

# Define maintainer scripts before luci.mk evaluates BuildPackage
define Package/$(PKG_NAME)/postinst
#!/bin/sh
INSTROOT="$${IPKG_INSTROOT:-/}"
chmod 755 "$${INSTROOT}/etc/init.d/timecontrol" \
	"$${INSTROOT}/usr/libexec/rpcd/luci.timecontrol" 2>/dev/null
[ -n "$${IPKG_INSTROOT}" ] || {
	# Enable and start timecontrol service on first install
	/etc/init.d/timecontrol enable
	/etc/init.d/timecontrol start

	# Make rpcd pick up the new ubus object
	/etc/init.d/rpcd reload 2>/dev/null

	# Clear LuCI cache
	rm -rf /tmp/luci-indexcache /tmp/luci-modulecache

	# Restart LuCI if running
	/etc/init.d/uhttpd restart 2>/dev/null
}
exit 0
endef

define Package/$(PKG_NAME)/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Stop and disable timecontrol service
	/etc/init.d/timecontrol stop
	/etc/init.d/timecontrol disable
}
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# luci.mk installs root/ (etc + rpcd) and htdocs/ (JavaScript view) automatically
