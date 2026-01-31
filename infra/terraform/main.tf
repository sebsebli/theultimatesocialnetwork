terraform {
  required_providers {
    hcloud = {
      source = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

variable "hcloud_token" {
  sensitive = true
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_network" "cite_net" {
  name     = "citewalk-network"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "cite_subnet" {
  network_id   = hcloud_network.cite_net.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

resource "hcloud_server" "cite_app" {
  name        = "Citewalk-app-prod"
  image       = "ubuntu-22.04"
  server_type = "cx21" # 2 vCPU, 4 GB RAM
  location    = "fsn1" # Falkenstein, Germany (EU Data Sovereignty)
  
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  network {
    network_id = hcloud_network.cite_net.id
    ip         = "10.0.1.5"
  }

  user_data = file("cloud-init.yaml")

  labels = {
    environment = "production"
    app         = "Citewalk"
  }
}

resource "hcloud_firewall" "cite_fw" {
  name = "Citewalk-firewall"
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"] # Restrict in real prod
  }
}

resource "hcloud_volume" "cite_data" {
  name      = "Citewalk-data"
  size      = 50
  server_id = hcloud_server.cite_app.id
  automount = true
  format    = "ext4"
}
