# Descrição do Servidor e seus Serviços

## Virtualizador
- VMWare Workstation Pro 26H1 (Hyper-V)

## Hardware Virtual
- Windows Server 2025 Datacenter
- 4 vCPUs (2 packages, 4 cores)
- 4GB RAM
- 128GB NVMe
- 2x Adaptadores de rede de 1Gbps Full Duplex (um em NAT e o outro na rede virtual privada VMNet0)

## Hardware do Host
- Intel Core i7-9700K (8C / 8T)
- 24GB RAM DDR4
- SSD SanDisk Ultra 3D NVMe

## Serviços do Windows Server
- Serviço IIS (ASP.NET) rodando a API
- Serviço DHCP
- Serviço DNS
- Serviço Active Directory
- Monitor de Desempenho (com triggers configurados)