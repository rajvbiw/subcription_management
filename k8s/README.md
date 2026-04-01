# Deployment Guide - Kubernetes (Local/Standard)

These manifests are designed to deploy the Subscription Management system to any Kubernetes cluster without cloud-specific dependencies (no AWS services).

## Prerequisites
1.  **kubectl**: Installed and configured for your cluster.
2.  **Images**: You must build your local images and make them available to your cluster.
    ```bash
    # Build locally
    docker build -t subscription-backend:latest ./backend
    docker build -t subscription-frontend:latest ./frontend
    
    # Example for Kind:
    kind load docker-image subscription-backend:latest
    kind load docker-image subscription-frontend:latest
    ```

## Deployment Steps

Execute the following commands in the project root:

1.  **Create Namespace**:
    ```bash
    kubectl apply -f k8s/namespace.yaml
    ```

2.  **Apply Configuration (Secrets & ConfigMaps)**:
    ```bash
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/init-configmap.yaml
    ```

3.  **Deployment (Database First)**:
    ```bash
    kubectl apply -f k8s/db.yaml
    ```
    *Wait for the database pod to be 'Running' before proceeding.*

4.  **Deploy Application Layers**:
    ```bash
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/frontend.yaml
    ```

## Accessing the Application

- **Frontend**: Accessible via **NodePort 30080**.
  - If using Minikube: `minikube service frontend -n subscription-man`
  - Otherwise: `http://<Node-IP>:30080`
- **Backend API**: Accessible internally at `http://backend:5000`.

## Verification

Check the status of all resources:
```bash
kubectl get all -n subscription-man
```
