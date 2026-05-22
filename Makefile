.PHONY: build deploy-testnet dev setup-testnet

# Tên ví admin dùng cho testnet
ADMIN_ACCOUNT = admin

build:
	@echo "Đang build smart contract..."
	stellar contract build

setup-testnet:
	@echo "Cấu hình mạng testnet và tạo ví admin..."
	stellar network add testnet --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" || true
	stellar keys generate $(ADMIN_ACCOUNT) --network testnet --fund --overwrite || true

deploy-testnet: build setup-testnet
	@echo "Đang deploy contract lên testnet..."
	stellar contract deploy \
		--wasm target/wasm32v1-none/release/family_fund.wasm \
		--source $(ADMIN_ACCOUNT) \
		--network testnet

dev:
	@echo "Đang chạy Frontend..."
	cd frontend && npm run dev
