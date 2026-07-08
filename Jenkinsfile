// ── 100Bocas CI/CD Pipeline ─────────────────────
// Builds Docker images, pushes to registry, deploys to k3s

pipeline {
    agent any

    environment {
        REGISTRY = "192.168.1.11:5000"
        K8S_OVERLAY = "k8s/overlays/production"
        BACKEND_IMAGE = "${REGISTRY}/bocas-backend"
        FRONTEND_IMAGE = "${REGISTRY}/bocas-frontend"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
    }

    parameters {
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deploy even if same tag already exists'
        )
        booleanParam(
            name: 'FORCE_PRODUCTION',
            defaultValue: false,
            description: 'Force deploy as production (ignore branch name, deploy to bocas namespace)'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Read Version') {
            steps {
                script {
                    def pkg = sh(script: "jq -r .version frontend/package.json", returnStdout: true).trim()
                    env.APP_VERSION = pkg
                    env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
            }
        }

        stage('Detect Branch Type') {
            steps {
                script {
                    env.BRANCH_NAME = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    env.IS_MAIN = (env.BRANCH_NAME == 'main').toString()
                    echo "Branch: ${env.BRANCH_NAME} (is_main: ${env.IS_MAIN})"

                    if (params.FORCE_PRODUCTION) {
                        env.IS_MAIN = 'true'
                        echo "→ FORCE_PRODUCTION=true — deploying as production"
                    }

                    if (env.IS_MAIN == 'true') {
                        env.DEPLOY_NAMESPACE = 'bocas'
                        env.IMAGE_TAG = "${env.APP_VERSION}-${env.GIT_SHORT}"
                    } else {
                        // Sanitize branch name for k8s (lowercase, alphanumeric + hyphens)
                        def rawBranch = env.BRANCH_NAME
                        env.BRANCH_SAFE = sh(
                            script: "python3 -c \"import re; b='${rawBranch}'; b=re.sub(r'[^a-zA-Z0-9]','-',b); b=re.sub(r'-+','-',b); b=b.strip('-').lower(); print(b)\"",
                            returnStdout: true
                        ).trim()
                        env.DEPLOY_NAMESPACE = "bocas-branch-${env.BRANCH_SAFE}"
                        env.IMAGE_TAG = "${env.BRANCH_SAFE}"
                        echo "→ Branch deployment: ${env.BRANCH_NAME}"
                        echo "  Safe name:     ${env.BRANCH_SAFE}"
                        echo "  Namespace:     ${env.DEPLOY_NAMESPACE}"
                        echo "  Image tag:     ${env.IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Check Image Exists') {
            when {
                expression { return env.IS_MAIN == 'true' && !params.FORCE_DEPLOY }
            }
            steps {
                script {
                    def skips = []
                    for (img in ['bocas-backend', 'bocas-frontend']) {
                        def manifestUrl = "${REGISTRY}/v2/${img}/manifests/${env.IMAGE_TAG}"
                        def exists = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' http://${manifestUrl}",
                            returnStdout: true
                        ).trim() == "200"
                        if (exists) {
                            echo "✓ Image ${img}:${env.IMAGE_TAG} already exists — skipping build"
                            skips << img
                        }
                    }
                    if (skips.size() == 2) {
                        env.SKIP_BUILD = 'true'
                    }
                }
            }
        }

        stage('Build Frontend') {
            when {
                expression { env.SKIP_BUILD != 'true' }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npx vite build --outDir ../dist/client'
                    sh 'npx vite build --ssr src/entry-server.tsx --outDir ../dist/server'
                }
            }
        }

        stage('Docker Build & Push') {
            when {
                expression { env.SKIP_BUILD != 'true' }
            }
            parallel {
                stage('Backend') {
                    steps {
                        script {
                            sh "DOCKER_BUILDKIT=0 docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -f Dockerfile.backend ."
                            sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                            if (env.IS_MAIN == 'true') {
                                sh "docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest"
                                sh "docker push ${BACKEND_IMAGE}:latest"
                            }
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        script {
                            sh "DOCKER_BUILDKIT=0 docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -f Dockerfile.frontend ."
                            sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                            if (env.IS_MAIN == 'true') {
                                sh "docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest"
                                sh "docker push ${FRONTEND_IMAGE}:latest"
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to k3s') {
            steps {
                dir('k8s') {
                    script {
                        if (env.IS_MAIN == 'true') {
                            // ── PRODUCTION DEPLOYMENT ──
                            sh """
                                cd overlays/production
                                kustomize edit set image PLACEHOLDER_BACKEND=${BACKEND_IMAGE}:${IMAGE_TAG}
                                kustomize edit set image PLACEHOLDER_FRONTEND=${FRONTEND_IMAGE}:${IMAGE_TAG}
                                echo ""
                                echo "═══════════════ K8S CONFIG to deploy ═══════════════"
                                echo "--- kustomization.yaml ---"
                                cat kustomization.yaml
                                echo ""
                                echo "--- kustomize build output ---"
                                kustomize build
                                echo "═══════════════════════════════════════════════════════"
                            """
                            // Create secret only if it doesn't exist — never overwrite existing
                            sh '''
                                if ! kubectl get secret bocas-secrets -n bocas 2>/dev/null; then
                                    echo "→ Creating bocas-secrets from base/secrets.yaml..."
                                    kubectl apply -f ../base/secrets.yaml
                                else
                                    echo "✓ bocas-secrets already exists — keeping existing values"
                                fi
                            '''
                            sh 'kubectl apply -k overlays/production'
                            sh '''
                                echo "--- Forcing rollout restart to pick up fresh image ---"
                                kubectl rollout restart deployment/bocas-backend -n bocas
                                kubectl rollout restart deployment/bocas-frontend -n bocas
                            '''
                        } else {
                            // ── BRANCH / PREVIEW DEPLOYMENT ──
                            def safeName = env.BRANCH_SAFE
                            def deployNs = env.DEPLOY_NAMESPACE
                            sh """
                                # Generate branch kustomization with actual values
                                cat overlays/branch/kustomization.yaml \\
                                  | sed 's|PLACEHOLDER_BRANCH_TAG|${IMAGE_TAG}|g' \\
                                  | sed 's/PLACEHOLDER_BRANCH/${safeName}/g' \\
                                  > overlays/branch/kustomization.yaml.generated

                                echo ""
                                echo "═══════════════ K8S CONFIG to deploy ═══════════════"
                                echo "--- Generated kustomization.yaml ---"
                                cat overlays/branch/kustomization.yaml.generated
                                echo ""
                                echo "--- Branch kustomize build output ---"
                                kustomize build overlays/branch
                                echo "═══════════════════════════════════════════════════════"
                                echo ""

                                # Create namespace + secrets if needed
                                kubectl get namespace ${deployNs} 2>/dev/null || \\
                                  kubectl create namespace ${deployNs}

                                if ! kubectl get secret bocas-secrets -n ${deployNs} 2>/dev/null; then
                                    echo "→ Creating bocas-secrets in ${deployNs}..."
                                    kubectl apply -f ../base/secrets.yaml -n ${deployNs}
                                else
                                    echo "✓ bocas-secrets already exists in ${deployNs}"
                                fi

                                # Deploy branch (use generated kustomization)
                                mv overlays/branch/kustomization.yaml.generated overlays/branch/kustomization.yaml
                                kubectl apply -k overlays/branch

                                echo "--- Forcing rollout restart to pick up fresh image ---"
                                kubectl rollout restart deployment/bocas-backend -n ${deployNs}
                                kubectl rollout restart deployment/bocas-frontend -n ${deployNs}

                                echo ""
                                echo "═══════════════ Deployed Resources ═══════════════════"
                                kubectl get all -n ${deployNs}
                                echo "═══════════════════════════════════════════════════════"
                                echo ""
                                echo "✅ Branch ${BRANCH_NAME} deployed to ${deployNs}"
                            """
                        }
                    }
                }
            }
        }

        stage('Verify Rollout') {
            steps {
                script {
                    def timeoutSeconds = 120
                    def success = true
                    def ns = env.DEPLOY_NAMESPACE
                    echo "→ Verifying rollout in namespace: ${ns}"
                    for (deploy in ['bocas-backend', 'bocas-frontend', 'bocas-db']) {
                        try {
                            sh """
                                kubectl rollout status deployment/${deploy} -n ${ns} \
                                    --timeout=${timeoutSeconds}s
                            """
                            echo "✓ ${deploy} rollout complete (${ns})"
                        } catch (err) {
                            echo "✗ ${deploy} rollout failed in ${ns}!"
                            success = false
                        }
                    }
                    if (!success) {
                        error "One or more deployments failed to roll out"
                    }

                    // For branches, show the preview URL
                    if (env.IS_MAIN != 'true') {
                        def url = "http://branch-${env.BRANCH_SAFE}.100bocas.cabrasky.net"
                        echo "✅ Branch deployed at: ${url}"
                    }
                }
            }
        }

        stage('Cleanup Stale Branches') {
            when {
                expression { return env.IS_MAIN == 'true' }
            }
            steps {
                script {
                    echo "═══════════════ Cleaning stale branch deployments ═══════════════"

                    // 1. Build a set of sanitized safe names from actual remote branches
                    def safeBranches = [:]
                    def branches = sh(
                        script: "git ls-remote --heads origin | awk '{print \$2}' | sed 's|refs/heads/||'",
                        returnStdout: true
                    ).trim()
                    for (br in branches.readLines()) {
                        if (!br.trim()) continue
                        def safe = sh(
                            script: "echo '${br}' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g;s/--*/-/g;s/^-//;s/-\$//'",
                            returnStdout: true
                        ).trim()
                        safeBranches[safe] = br.trim()
                    }
                    echo "Active remote branches (safe): ${safeBranches.keySet().sort()}"

                    // 2. List all branch namespaces and clean stale ones
                    def nsOutput = sh(
                        script: "kubectl get ns --no-headers -o name 2>/dev/null | grep 'bocas-branch-' | sed 's|namespace/||' || true",
                        returnStdout: true
                    ).trim()
                    for (ns in nsOutput.readLines()) {
                        ns = ns.trim()
                        if (!ns) continue
                        def branchSafe = ns - 'bocas-branch-'
                        echo "  Checking ${ns} → safe: ${branchSafe}"

                        if (safeBranches.containsKey(branchSafe)) {
                            echo "  ✓ Branch '${safeBranches[branchSafe]}' exists — keeping ${ns}"
                        } else {
                            echo "  ✗ Branch '${branchSafe}' not found — deleting namespace ${ns}"
                            sh "kubectl delete namespace ${ns} --ignore-not-found --wait=false"
                        }
                    }

                    echo "══════════════════════════════════════════════════════════════════"
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
        failure {
            echo '❌ Pipeline failed — check logs'
        }
        success {
            script {
                if (env.IS_MAIN == 'true') {
                    echo '✅ 100Bocas production deployed successfully'
                } else {
                    echo "✅ 100Bocas branch '${env.BRANCH_NAME}' deployed to ${env.DEPLOY_NAMESPACE}"
                    echo "   URL: http://branch-${env.BRANCH_SAFE}.100bocas.cabrasky.net"
                }
            }
        }
    }
}
